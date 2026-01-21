import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';

export interface WebhookEvent {
  id: string;
  type: string; // 'dm.received', 'comment.created', 'follow.new', etc.
  timestamp: number;
  data: Record<string, any>;
}

export interface Webhook {
  id?: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status: number | null;
  response_body: string | null;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  error_message: string | null;
  retry_count: number;
  sent_at: Date;
  completed_at: Date | null;
}

const MAX_RETRIES = 5;

class WebhookService {
  /**
   * Create new webhook
   */
  async createWebhook(userId: string, data: {
    name: string;
    url: string;
    events: string[];
  }): Promise<Webhook> {
    const secret = this.generateSecret();
    const sql = `
      INSERT INTO webhooks (user_id, name, url, events, secret, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      userId,
      data.name,
      data.url,
      data.events,
      secret,
      true, // is_active
    ];
    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Get user's webhooks
   */
  async getWebhooks(userId: string): Promise<Webhook[]> {
    const sql = `
      SELECT * FROM webhooks
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(id: string): Promise<Webhook | null> {
    const sql = `SELECT * FROM webhooks WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    id: string,
    userId: string,
    data: Partial<Webhook>
  ): Promise<Webhook | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      params.push(data.url);
    }
    if (data.events !== undefined) {
      updates.push(`events = $${paramIndex++}`);
      params.push(data.events);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.is_active);
    }

    if (updates.length === 0) {
      return this.getWebhookById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id, userId);

    const sql = `
      UPDATE webhooks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;
    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: string, userId: string): Promise<boolean> {
    const sql = `DELETE FROM webhooks WHERE id = $1 AND user_id = $2`;
    const result = await query(sql, [id, userId]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Trigger webhooks for specific event type
   */
  async triggerWebhooks(userId: string, eventType: string, payload: Record<string, any>): Promise<void> {
    // Get active webhooks that listen to this event type
    const sql = `
      SELECT * FROM webhooks
      WHERE user_id = $1 AND is_active = true AND $2 = ANY(events)
    `;
    const result = await query(sql, [userId, eventType]);
    const webhooks: Webhook[] = result.rows;

    // Enqueue webhook deliveries (using webhookDeliveryEngine)
    // For now, we'll call deliverWebhook directly (will be enhanced with queue later)
    const webhookDeliveryEngine = await import('./webhookDeliveryEngine');

    for (const webhook of webhooks) {
      // Create delivery log
      const logId = await this.createWebhookLog(webhook.id!, eventType, payload);

      // Deliver webhook
      webhookDeliveryEngine.default.deliverWebhook(webhook, {
        id: uuidv4(),
        type: eventType,
        timestamp: Date.now(),
        data: payload,
      }, logId);
    }
  }

  /**
   * Create webhook delivery log
   */
  async createWebhookLog(
    webhookId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<string> {
    const sql = `
      INSERT INTO webhook_logs (webhook_id, event_type, payload, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id
    `;
    const result = await query(sql, [webhookId, eventType, JSON.stringify(payload)]);
    return result.rows[0].id;
  }

  /**
   * Update webhook delivery log
   */
  async updateWebhookLog(
    logId: string,
    data: {
      status?: 'success' | 'failed' | 'retrying';
      response_status?: number;
      response_body?: string;
      error_message?: string;
      retry_count?: number;
      completed_at?: Date;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.response_status !== undefined) {
      updates.push(`response_status = $${paramIndex++}`);
      params.push(data.response_status);
    }
    if (data.response_body !== undefined) {
      updates.push(`response_body = $${paramIndex++}`);
      params.push(data.response_body);
    }
    if (data.error_message !== undefined) {
      updates.push(`error_message = $${paramIndex++}`);
      params.push(data.error_message);
    }
    if (data.retry_count !== undefined) {
      updates.push(`retry_count = $${paramIndex++}`);
      params.push(data.retry_count);
    }
    if (data.completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`);
      params.push(data.completed_at);
    }

    if (updates.length === 0) {
      return;
    }

    params.push(logId);

    const sql = `
      UPDATE webhook_logs
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;
    await query(sql, params);
  }

  /**
   * Get webhook delivery logs
   */
  async getWebhookLogs(
    webhookId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ logs: WebhookLog[]; total: number }> {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT * FROM webhook_logs
      WHERE webhook_id = $1
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [webhookId, limit, offset]);

    const countSql = `
      SELECT COUNT(*) as total FROM webhook_logs WHERE webhook_id = $1
    `;
    const countResult = await query(countSql, [webhookId]);

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  /**
   * Get webhook log by ID
   */
  async getWebhookLogById(logId: string): Promise<WebhookLog | null> {
    const sql = `SELECT * FROM webhook_logs WHERE id = $1`;
    const result = await query(sql, [logId]);
    return result.rows[0] || null;
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Generate random secret for webhook
   */
  generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default new WebhookService();
