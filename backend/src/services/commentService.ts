import pool from '../config/database';
import InstagramGraphClient from './instagramClient';

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
  media_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  status: 'pending' | 'replied' | 'ignored';
  replied_at?: Date;
  reply_message_id?: string;
}

interface KeywordRule {
  id: string;
  user_id: string;
  keyword: string;
  is_active: boolean;
}

interface ReplyTemplate {
  id: string;
  user_id: string;
  template_name: string;
  content: string;
  is_active: boolean;
}

class CommentService {
  /**
   * Fetch comments from Instagram API and save to database
   */
  async fetchAndSaveComments(mediaId: string, accessToken: string, userId: string): Promise<void> {
    const client = new InstagramGraphClient(accessToken);

    try {
      // Fetch comments from Instagram
      const comments = await client.getComments(mediaId);

      // Save to database
      for (const comment of comments) {
        const query = `
          INSERT INTO instagram_comments (
            comment_id,
            username,
            text,
            timestamp,
            media_id,
            media_type,
            status,
            user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (comment_id) DO UPDATE SET
            status = EXCLUDED.status,
            replied_at = EXCLUDED.replied_at
          RETURNING *;
        `;

        await pool.query(query, [
          comment.id,
          comment.username,
          comment.text,
          new Date(comment.timestamp),
          mediaId,
          'IMAGE', // Default, should be fetched from media info
          'pending',
          userId,
        ]);
      }
    } catch (error) {
      console.error('Error fetching and saving comments:', error);
      throw error;
    }
  }

  /**
   * Get pending comments for auto-reply
   */
  async getPendingComments(userId: string): Promise<Comment[]> {
    const query = `
      SELECT * FROM instagram_comments
      WHERE user_id = $1
        AND status = 'pending'
      ORDER BY timestamp DESC
      LIMIT 100;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get all comments for dashboard
   */
  async getAllComments(userId: string, limit: number = 50, offset: number = 0): Promise<Comment[]> {
    const query = `
      SELECT * FROM instagram_comments
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get comments for a specific media
   */
  async getCommentsByMediaId(userId: string, mediaId: string): Promise<Comment[]> {
    const query = `
      SELECT * FROM instagram_comments
      WHERE user_id = $1 AND media_id = $2
      ORDER BY timestamp DESC;
    `;

    const result = await pool.query(query, [userId, mediaId]);
    return result.rows;
  }

  /**
   * Mark comment as replied
   */
  async markCommentAsReplied(commentId: string, replyMessageId: string): Promise<void> {
    const query = `
      UPDATE instagram_comments
      SET status = 'replied',
          replied_at = CURRENT_TIMESTAMP,
          reply_message_id = $2
      WHERE comment_id = $1;
    `;

    await pool.query(query, [commentId, replyMessageId]);
  }

  /**
   * Mark comment as ignored
   */
  async markCommentAsIgnored(commentId: string): Promise<void> {
    const query = `
      UPDATE instagram_comments
      SET status = 'ignored'
      WHERE comment_id = $1;
    `;

    await pool.query(query, [commentId]);
  }

  /**
   * Check if comment matches any keyword rules
   */
  async getMatchingKeywordRules(userId: string, commentText: string): Promise<KeywordRule[]> {
    const query = `
      SELECT * FROM comment_keyword_rules
      WHERE user_id = $1
        AND is_active = true
      ORDER BY keyword;
    `;

    const result = await pool.query(query, [userId]);
    const rules = result.rows;

    // Find matching rules
    const matchingRules = rules.filter((rule: KeywordRule) => {
      return commentText.toLowerCase().includes(rule.keyword.toLowerCase());
    });

    return matchingRules;
  }

  /**
   * Get reply template
   */
  async getReplyTemplate(userId: string, templateId: string): Promise<ReplyTemplate | null> {
    const query = `
      SELECT * FROM comment_reply_templates
      WHERE id = $1 AND user_id = $2;
    `;

    const result = await pool.query(query, [templateId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Get all reply templates
   */
  async getAllReplyTemplates(userId: string): Promise<ReplyTemplate[]> {
    const query = `
      SELECT * FROM comment_reply_templates
      WHERE user_id = $1
      ORDER BY template_name;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Create reply template
   */
  async createReplyTemplate(
    userId: string,
    templateName: string,
    content: string
  ): Promise<ReplyTemplate> {
    const query = `
      INSERT INTO comment_reply_templates (user_id, template_name, content, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING *;
    `;

    const result = await pool.query(query, [userId, templateName, content]);
    return result.rows[0];
  }

  /**
   * Update reply template
   */
  async updateReplyTemplate(
    templateId: string,
    templateName: string,
    content: string,
    isActive: boolean
  ): Promise<void> {
    const query = `
      UPDATE comment_reply_templates
      SET template_name = $2,
          content = $3,
          is_active = $4
      WHERE id = $1;
    `;

    await pool.query(query, [templateId, templateName, content, isActive]);
  }

  /**
   * Delete reply template
   */
  async deleteReplyTemplate(templateId: string): Promise<void> {
    const query = `
      DELETE FROM comment_reply_templates
      WHERE id = $1;
    `;

    await pool.query(query, [templateId]);
  }

  /**
   * Create keyword rule
   */
  async createKeywordRule(
    userId: string,
    keyword: string
  ): Promise<KeywordRule> {
    const query = `
      INSERT INTO comment_keyword_rules (user_id, keyword, is_active)
      VALUES ($1, $2, true)
      RETURNING *;
    `;

    const result = await pool.query(query, [userId, keyword]);
    return result.rows[0];
  }

  /**
   * Get all keyword rules
   */
  async getAllKeywordRules(userId: string): Promise<KeywordRule[]> {
    const query = `
      SELECT * FROM comment_keyword_rules
      WHERE user_id = $1
      ORDER BY keyword;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Update keyword rule
   */
  async updateKeywordRule(
    ruleId: string,
    keyword: string,
    isActive: boolean
  ): Promise<void> {
    const query = `
      UPDATE comment_keyword_rules
      SET keyword = $2,
          is_active = $3
      WHERE id = $1;
    `;

    await pool.query(query, [ruleId, keyword, isActive]);
  }

  /**
   * Delete keyword rule
   */
  async deleteKeywordRule(ruleId: string): Promise<void> {
    const query = `
      DELETE FROM comment_keyword_rules
      WHERE id = $1;
    `;

    await pool.query(query, [ruleId]);
  }

  /**
   * Get comment statistics
   */
  async getCommentStats(userId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_comments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_comments,
        COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied_comments,
        COUNT(CASE WHEN status = 'ignored' THEN 1 END) as ignored_comments,
        COUNT(CASE WHEN replied_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_replies
      FROM instagram_comments
      WHERE user_id = $1;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Auto-reply to pending comments
   */
  async autoReplyToComments(accessToken: string, userId: string): Promise<number> {
    const pendingComments = await this.getPendingComments(userId);
    const client = new InstagramGraphClient(accessToken);
    let repliedCount = 0;

    for (const comment of pendingComments) {
      try {
        // Check for keyword match
        const matchingRules = await this.getMatchingKeywordRules(userId, comment.text);

        if (matchingRules.length === 0) {
          // No matching keyword, skip
          console.log(`Skipping comment ${comment.id} - no matching keyword`);
          continue;
        }

        // Get reply template (first matching rule)
        const rule = matchingRules[0];
        const template = await this.getReplyTemplate(userId, rule.id);

        if (!template) {
          console.log(`Skipping comment ${comment.id} - no template found`);
          await this.markCommentAsIgnored(comment.id);
          continue;
        }

        // Replace placeholders in template
        const replyMessage = template.content
          .replace('{username}', comment.username)
          .replace('{comment}', comment.text);

        // Send reply
        await client.replyToComment(comment.id, replyMessage);

        // Mark as replied
        await this.markCommentAsReplied(comment.id, comment.id);

        repliedCount++;
        console.log(`Successfully replied to comment ${comment.id}`);
      } catch (error) {
        console.error(`Error replying to comment ${comment.id}:`, error);
      }
    }

    return repliedCount;
  }
}

export default CommentService;
