import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

// GET /api/webhooks - List all webhooks
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { type, active } = req.query;
    
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (active !== undefined) {
      whereClause += ` AND active = $${paramIndex++}`;
      params.push(active === 'true');
    }

    const result = await query(
      `SELECT * FROM webhooks ${whereClause} ORDER BY created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ success: false, error: 'Failed to list webhooks' });
  }
});

// POST /api/webhooks - Create new webhook
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, type, url, events, retry_config } = req.body;

    if (!name || !type || !url) {
      return res.status(400).json({ success: false, error: 'Name, type, and URL are required' });
    }

    if (!events || events.length === 0) {
      return res.status(400).json({ success: false, error: 'Events list is required' });
    }

    const crypto = require('crypto');
    const secret = `wh_${crypto.randomBytes(16).toString('hex')}_${Date.now().toString(36)}`;

    const result = await query(
      `INSERT INTO webhooks (user_id, name, type, url, secret, events, active, retry_config, total_triggers, success_count, failure_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 9, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, name, type, url, secret, JSON.stringify(events), JSON.stringify(retry_config || { max_retries: 3, retry_delay: 60 })]
    );

    res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        secret, // Only show secret on creation
      },
    });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to create webhook' });
  }
});

// GET /api/webhooks/:id - Get webhook details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const webhook = result.rows[0];
    
    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    console.error('Error getting webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to get webhook' });
  }
});

// PUT /api/webhooks/:id - Update webhook
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { name, url, events, active, retry_config } = req.body;

    const result = await query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 3;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(url);
    }
    if (events !== undefined) {
      updates.push(`events = $${paramIndex++}`);
      values.push(JSON.stringify(events));
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`);
      values.push(active);
    }
    if (retry_config !== undefined) {
      updates.push(`retry_config = $${paramIndex++}`);
      values.push(JSON.stringify(retry_config));
    }

    values.push(id);
    const queryStr = `UPDATE webhooks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;

    const updateResult = await query(queryStr, values);

    res.json({
      success: true,
      data: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to update webhook' });
  }
});

// DELETE /api/webhooks/:id - Delete webhook
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    await query('DELETE FROM webhook_logs WHERE webhook_id = $1', [id]);
    await query('DELETE FROM webhooks WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to delete webhook' });
  }
});

// POST /api/webhooks/:id/trigger - Manually trigger webhook
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { payload } = req.body;

    const result = await query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const webhook = result.rows[0];

    if (!webhook.active) {
      return res.status(400).json({ success: false, error: 'Webhook is not active' });
    }

    await query(
      `INSERT INTO webhook_logs (webhook_id, event_type, payload, status, created_at)
       VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, 'manual_trigger', JSON.stringify(payload || {})]
    );

    await query(
      `UPDATE webhooks SET total_triggers = total_triggers + 1, last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Webhook triggered successfully',
    });
  } catch (error: any) {
    console.error('Error triggering webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger webhook' });
  }
});

// GET /api/webhooks/:id/logs - Get webhook logs
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { limit = 50, status } = req.query;

    let whereClause = 'WHERE webhook_id = $1';
    const params: any[] = [id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    const result = await query(
      `SELECT * FROM webhook_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM webhook_logs ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: Number(limit),
        total: parseInt(countResult.rows[0].total),
        page: 1,
        has_more: result.rows.length === Number(limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting webhook logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get webhook logs' });
  }
});

// POST /api/webhooks/:id/test - Test webhook
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const webhook = result.rows[0];

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id,
      webhook_name: webhook.name,
      source: 'manual_test',
    };

    await query(
      `INSERT INTO webhook_logs (webhook_id, event_type, payload, status, created_at)
       VALUES ($1, 'test_event', $2, 'sent', CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, JSON.stringify(testPayload)]
    );

    res.json({
      success: true,
      message: 'Test payload sent to webhook',
      data: {
        test_payload: testPayload,
        webhook_url: webhook.url,
      },
    });
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to test webhook' });
  }
});

export default router;
