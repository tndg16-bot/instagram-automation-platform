import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import { query } from '../../config/database';
import crypto from 'crypto';

const router = Router();

// Webhook endpoint interface
interface WebhookEndpoint {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret_key: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * GET /api/webhooks/endpoints
 * List user's webhook endpoints
 */
router.get('/endpoints', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, url, events, is_active, created_at FROM webhook_endpoints WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching webhook endpoints:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch webhook endpoints' });
  }
});

/**
 * POST /api/webhooks/endpoints
 * Create new webhook endpoint
 */
router.post('/endpoints', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ success: false, error: 'URL and events are required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    // Generate secret key
    const secretKey = crypto.randomBytes(32).toString('hex');

    const result = await query(
      `INSERT INTO webhook_endpoints (user_id, url, events, secret_key, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, url, events, is_active, created_at`,
      [userId, url, events, secretKey]
    );

    res.status(201).json({ 
      success: true, 
      data: result.rows[0],
      secret_key: secretKey // Show only once
    });
  } catch (error) {
    console.error('Error creating webhook endpoint:', error);
    res.status(500).json({ success: false, error: 'Failed to create webhook endpoint' });
  }
});

/**
 * DELETE /api/webhooks/endpoints/:id
 * Delete webhook endpoint
 */
router.delete('/endpoints/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    await query(
      'DELETE FROM webhook_endpoints WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true, message: 'Webhook endpoint deleted' });
  } catch (error) {
    console.error('Error deleting webhook endpoint:', error);
    res.status(500).json({ success: false, error: 'Failed to delete webhook endpoint' });
  }
});

/**
 * POST /api/webhooks/endpoints/:id/test
 * Test webhook endpoint
 */
router.post('/endpoints/:id/test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get endpoint
    const endpointResult = await query(
      'SELECT * FROM webhook_endpoints WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (endpointResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Endpoint not found' });
    }

    const endpoint = endpointResult.rows[0];

    // Send test webhook
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook' }
    };

    // Generate signature
    const signature = crypto
      .createHmac('sha256', endpoint.secret_key)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    // Send HTTP POST
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'test'
      },
      body: JSON.stringify(testPayload)
    });

    // Log the test
    await query(
      `INSERT INTO webhook_logs (endpoint_id, event_type, payload, response_status, response_body)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, 'test', testPayload, response.status, await response.text()]
    );

    res.json({ 
      success: true, 
      data: {
        status: response.status,
        success: response.ok
      }
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to test webhook' });
  }
});

/**
 * GET /api/webhooks/logs
 * Get webhook delivery logs
 */
router.get('/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { endpoint_id, limit = 50 } = req.query;

    let sql = `
      SELECT wl.* FROM webhook_logs wl
      JOIN webhook_endpoints we ON wl.endpoint_id = we.id
      WHERE we.user_id = $1
    `;
    const params: any[] = [userId];

    if (endpoint_id) {
      sql += ' AND wl.endpoint_id = $2';
      params.push(endpoint_id);
    }

    sql += ' ORDER BY wl.created_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit as string));

    const result = await query(sql, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch webhook logs' });
  }
});

export default router;
