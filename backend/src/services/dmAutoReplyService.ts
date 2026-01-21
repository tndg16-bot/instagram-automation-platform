import pool from '../config/database';
import InstagramGraphClient from './instagramClient';
import { getInstagramAccessToken } from '../utils/tokenManager';

interface DMInboxMessage {
  id: string;
  message_id: string;
  sender_id: string;
  sender_username: string;
  recipient_id: string;
  text: string;
  media_url: string | null;
  media_type: string;
  timestamp: Date;
  status: 'pending' | 'replied' | 'ignored' | 'processing';
  replied_at: Date | null;
  reply_message_id: string | null;
  error_message: string | null;
  retry_count: number;
  user_id: string;
}

interface DMKeywordRule {
  id: string;
  user_id: string;
  keyword: string;
  reply_template_id: string | null;
  is_active: boolean;
}

interface DMMeta {
  id: string;
  template_name: string;
  content: string;
  media_url: string | null;
}

class DMAutoReplyService {
  /**
   * Save received DM to inbox
   */
  async saveDMToInbox(
    messageData: any,
    userId: string
  ): Promise<DMInboxMessage> {
    const query = `
      INSERT INTO dm_inbox (
        message_id,
        sender_id,
        sender_username,
        recipient_id,
        text,
        media_url,
        media_type,
        status,
        user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const params = [
      messageData.message_id,
      messageData.sender_id,
      messageData.sender_username,
      messageData.recipient_id,
      messageData.text,
      messageData.media_url,
      messageData.media_type || 'IMAGE',
      'pending',
      userId,
    ];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get pending DMs for auto-reply
   */
  async getPendingDMs(userId: string): Promise<DMInboxMessage[]> {
    const query = `
      SELECT * FROM dm_inbox
      WHERE user_id = $1
        AND status = 'pending'
      ORDER BY timestamp ASC
      LIMIT 100;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get all DMs for dashboard
   */
  async getAllDMs(userId: string, limit: number = 50, offset: number = 0): Promise<DMInboxMessage[]> {
    const query = `
      SELECT * FROM dm_inbox
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Mark DM as replied
   */
  async markDMAsReplied(dmId: string, replyMessageId: string): Promise<void> {
    const query = `
      UPDATE dm_inbox
      SET status = 'replied',
          replied_at = CURRENT_TIMESTAMP,
          reply_message_id = $2
      WHERE id = $1;
    `;

    await pool.query(query, [dmId, replyMessageId]);
  }

  /**
   * Mark DM as ignored
   */
  async markDMArIgnored(dmId: string): Promise<void> {
    const query = `
      UPDATE dm_inbox
      SET status = 'ignored'
      WHERE id = $1;
    `;

    await pool.query(query, [dmId]);
  }

  /**
   * Update DM status
   */
  async updateDMStatus(
    dmId: string,
    status: 'pending' | 'replied' | 'ignored' | 'processing',
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE dm_inbox
      SET status = $1,
          error_message = $2,
          retry_count = retry_count + 1
      WHERE id = $3;
    `;

    await pool.query(query, [status, errorMessage || null, dmId]);
  }

  /**
   * Check if DM matches any keyword rules
   */
  async getMatchingDMKeywordRules(userId: string, dmText: string): Promise<DMKeywordRule[]> {
    const query = `
      SELECT * FROM dm_keyword_rules
      WHERE user_id = $1
        AND is_active = true
      ORDER BY keyword;
    `;

    const result = await pool.query(query, [userId]);
    const rules = result.rows;

    // Find matching rules
    const matchingRules = rules.filter((rule: DMKeywordRule) => {
      return dmText.toLowerCase().includes(rule.keyword.toLowerCase());
    });

    return matchingRules;
  }

  /**
   * Get DM template
   */
  async getDMTemplate(userId: string, templateId: string): Promise<DMMeta | null> {
    const query = `
      SELECT * FROM dm_message_templates
      WHERE id = $1 AND user_id = $2;
    `;

    const result = await pool.query(query, [templateId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Get all DM keyword rules
   */
  async getAllDMKeywordRules(userId: string): Promise<DMKeywordRule[]> {
    const query = `
      SELECT * FROM dm_keyword_rules
      WHERE user_id = $1
      ORDER BY keyword;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Create DM keyword rule
   */
  async createDMKeywordRule(
    userId: string,
    keyword: string,
    replyTemplateId: string | null
  ): Promise<DMKeywordRule> {
    const query = `
      INSERT INTO dm_keyword_rules (user_id, keyword, reply_template_id, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (user_id, keyword) DO NOTHING
      RETURNING *;
    `;

    const result = await pool.query(query, [userId, keyword, replyTemplateId]);
    return result.rows[0];
  }

  /**
   * Update DM keyword rule
   */
  async updateDMKeywordRule(
    ruleId: string,
    keyword: string,
    replyTemplateId: string | null,
    isActive: boolean
  ): Promise<void> {
    const query = `
      UPDATE dm_keyword_rules
      SET keyword = $2,
          reply_template_id = $3,
          is_active = $4
      WHERE id = $1;
    `;

    await pool.query(query, [ruleId, keyword, replyTemplateId, isActive]);
  }

  /**
   * Delete DM keyword rule
   */
  async deleteDMKeywordRule(ruleId: string): Promise<void> {
    const query = `
      DELETE FROM dm_keyword_rules
      WHERE id = $1;
    `;

    await pool.query(query, [ruleId]);
  }

  /**
   * Get DM statistics
   */
  async getDMStats(userId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_messages,
        COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied_messages,
        COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored_messages,
        COUNT(CASE WHEN replied_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_replies
      FROM dm_inbox
      WHERE user_id = $1;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Auto-reply to pending DMs
   */
  async autoReplyToDMs(userId: string, instagramAccountId?: string): Promise<number> {
    const pendingDMs = await this.getPendingDMs(userId);
    const accessToken = await getInstagramAccessToken(userId, instagramAccountId);
    const client = new InstagramGraphClient(accessToken);
    let repliedCount = 0;

    for (const dm of pendingDMs) {
      try {
        // Mark as processing
        await this.updateDMStatus(dm.id, 'processing');

        // Check for keyword match
        const matchingRules = await this.getMatchingDMKeywordRules(userId, dm.text);

        if (matchingRules.length === 0) {
          // No matching keyword, mark as ignored
          console.log(`Skipping DM ${dm.message_id} - no matching keyword`);
          await this.markDMArIgnored(dm.id);
          continue;
        }

        // Get reply template (first matching rule)
        const rule = matchingRules[0];
        let replyMessage = rule.reply_template_id
          ? await this.getDMTemplate(userId, rule.reply_template_id!).then(t => t?.content || '')
          : '';

        // Replace placeholders in template
        replyMessage = replyMessage
          .replace('{username}', dm.sender_username)
          .replace('{message}', dm.text)
          .replace('{sender}', dm.sender_username);

        // Send reply
        await client.sendDM(dm.sender_id, replyMessage, dm.media_url || undefined);

        // Mark as replied
        await this.markDMAsReplied(dm.id, dm.message_id);

        repliedCount++;
        console.log(`Successfully replied to DM ${dm.message_id}`);
      } catch (error: any) {
        console.error(`Error replying to DM ${dm.message_id}:`, error);

        // Mark as pending with error message for retry
        await this.updateDMStatus(
          dm.id,
          'pending',
          error?.response?.data?.error?.message || error?.message || 'Failed to send reply'
        );
      }
    }

    return repliedCount;
  }

  /**
   * Process DM from webhook event
   */
  async processDMWebhookEvent(
    eventData: {
      message_id: string;
      sender_id: string;
      sender_username: string;
      recipient_id: string;
      text: string;
      media_url?: string;
      media_type?: string;
    },
    userId: string
  ): Promise<DMInboxMessage> {
    return await this.saveDMToInbox(eventData, userId);
  }
}

export default DMAutoReplyService;
