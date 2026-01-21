import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface DMCampaign {
  id: string;
  user_id: string;
  instagram_account_id: string;
  name: string;
  message: string;
  message_type: string;
  media_url?: string;
  segment_id?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  total_recipients?: number;
  sent_count: number;
  failed_count: number;
  delivered_count: number;
  read_count: number;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DMCampaignRecipient {
  id: string;
  campaign_id: string;
  recipient_id: string;
  recipient_username?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  error_message?: string;
  created_at: Date;
}

export interface DMSegment {
  id: string;
  user_id: string;
  instagram_account_id: string;
  name: string;
  description?: string;
  conditions: any[];
  is_dynamic: boolean;
  size: number;
  last_updated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DMMessageTemplate {
  id: string;
  user_id: string;
  name: string;
  message: string;
  message_type: string;
  media_url?: string;
  category?: string;
  tags: string[];
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

class DMCampaignService {
  async createCampaign(data: {
    user_id: string;
    instagram_account_id: string;
    name: string;
    message: string;
    message_type?: string;
    media_url?: string;
    segment_id?: string;
    scheduled_at?: Date;
  }): Promise<DMCampaign> {
    const result = await query(
      `INSERT INTO dm_campaigns (user_id, instagram_account_id, name, message, message_type, media_url, segment_id, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.user_id,
        data.instagram_account_id,
        data.name,
        data.message,
        data.message_type || 'TEXT',
        data.media_url || null,
        data.segment_id || null,
        data.scheduled_at || null,
      ]
    );
    return result.rows[0];
  }

  async getCampaignById(id: string): Promise<DMCampaign | null> {
    const result = await query('SELECT * FROM dm_campaigns WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getCampaignsByUserId(userId: string): Promise<DMCampaign[]> {
    const result = await query(
      'SELECT * FROM dm_campaigns WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async updateCampaignStatus(id: string, status: string, error_message?: string): Promise<void> {
    const params: any[] = [status, id];
    let queryStr = 'UPDATE dm_campaigns SET status = $1';

    if (error_message) {
      queryStr += ', error_message = $2';
      params.push(error_message);
      params.push(id);
      params.splice(1, 0, id);
    }

    queryStr += ' WHERE id = $' + params.length;
    await query(queryStr, params);
  }

  async updateCampaignStats(id: string, stats: {
    total_recipients?: number;
    sent_count?: number;
    failed_count?: number;
    delivered_count?: number;
    read_count?: number;
  }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (stats.total_recipients !== undefined) {
      fields.push(`total_recipients = $${paramIndex++}`);
      values.push(stats.total_recipients);
    }
    if (stats.sent_count !== undefined) {
      fields.push(`sent_count = $${paramIndex++}`);
      values.push(stats.sent_count);
    }
    if (stats.failed_count !== undefined) {
      fields.push(`failed_count = $${paramIndex++}`);
      values.push(stats.failed_count);
    }
    if (stats.delivered_count !== undefined) {
      fields.push(`delivered_count = $${paramIndex++}`);
      values.push(stats.delivered_count);
    }
    if (stats.read_count !== undefined) {
      fields.push(`read_count = $${paramIndex++}`);
      values.push(stats.read_count);
    }

    if (fields.length > 0) {
      values.push(id);
      const queryStr = `UPDATE dm_campaigns SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
      await query(queryStr, values);
    }
  }

  async addRecipientToCampaign(data: {
    campaign_id: string;
    recipient_id: string;
    recipient_username?: string;
  }): Promise<DMCampaignRecipient> {
    const result = await query(
      `INSERT INTO dm_campaign_recipients (campaign_id, recipient_id, recipient_username)
       VALUES ($1, $2, $3) RETURNING *`,
      [data.campaign_id, data.recipient_id, data.recipient_username || null]
    );
    return result.rows[0];
  }

  async updateRecipientStatus(
    id: string,
    status: string,
    error_message?: string
  ): Promise<void> {
    const params: any[] = [status, id];
    let queryStr = 'UPDATE dm_campaign_recipients SET status = $1';

    if (status === 'sent') {
      queryStr += ', sent_at = NOW()';
    }
    if (status === 'delivered') {
      queryStr += ', delivered_at = NOW()';
    }
    if (status === 'read') {
      queryStr += ', read_at = NOW()';
    }
    if (error_message) {
      queryStr += ', error_message = $2';
      params.push(error_message);
      params.splice(1, 0, id);
    }

    queryStr += ' WHERE id = $' + params.length;
    await query(queryStr, params);
  }

  async getCampaignRecipients(campaignId: string): Promise<DMCampaignRecipient[]> {
    const result = await query(
      'SELECT * FROM dm_campaign_recipients WHERE campaign_id = $1',
      [campaignId]
    );
    return result.rows;
  }

  async createSegment(data: {
    user_id: string;
    instagram_account_id: string;
    name: string;
    description?: string;
    conditions: any[];
    is_dynamic?: boolean;
  }): Promise<DMSegment> {
    const result = await query(
      `INSERT INTO dm_segments (user_id, instagram_account_id, name, description, conditions, is_dynamic)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.user_id,
        data.instagram_account_id,
        data.name,
        data.description || null,
        JSON.stringify(data.conditions),
        data.is_dynamic !== undefined ? data.is_dynamic : true,
      ]
    );
    return result.rows[0];
  }

  async getSegmentsByUserId(userId: string): Promise<DMSegment[]> {
    const result = await query(
      'SELECT * FROM dm_segments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async createTemplate(data: {
    user_id: string;
    name: string;
    message: string;
    message_type?: string;
    media_url?: string;
    category?: string;
    tags?: string[];
  }): Promise<DMMessageTemplate> {
    const result = await query(
      `INSERT INTO dm_message_templates (user_id, name, message, message_type, media_url, category, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.user_id,
        data.name,
        data.message,
        data.message_type || 'TEXT',
        data.media_url || null,
        data.category || null,
        JSON.stringify(data.tags || []),
      ]
    );
    return result.rows[0];
  }

  async getTemplatesByUserId(userId: string): Promise<DMMessageTemplate[]> {
    const result = await query(
      'SELECT * FROM dm_message_templates WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async incrementTemplateUsage(templateId: string): Promise<void> {
    await query(
      'UPDATE dm_message_templates SET usage_count = usage_count + 1 WHERE id = $1',
      [templateId]
    );
  }

  async logDMActivity(data: {
    user_id: string;
    instagram_account_id?: string;
    campaign_id?: string;
    recipient_id?: string;
    action: string;
    details?: any;
  }): Promise<void> {
    await query(
      `INSERT INTO dm_logs (user_id, instagram_account_id, campaign_id, recipient_id, action, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.user_id,
        data.instagram_account_id || null,
        data.campaign_id || null,
        data.recipient_id || null,
        data.action,
        data.details ? JSON.stringify(data.details) : null,
      ]
    );
  }
}

export default new DMCampaignService();
