import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import webhookService, { Webhook } from '../../services/webhookService';

const router = Router();

router.use(authenticate);

/**
 * POST /api/webhooks
 * Create new webhook
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, url, events } = req.body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Missing required fields: name, url, events' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Validate events
    const validEvents = [
      'dm.received',
      'comment.created',
      'comment.replied',
      'follow.new',
      'follow.removed',
      'mention.created',
      'like.added',
      'media.published',
      'media.scheduled',
    ];

    const invalidEvents = events.filter((event: string) => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ 
        error: `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${validEvents.join(', ')}` 
      });
    }

    const webhook = await webhookService.createWebhook(userId, { name, url, events });

    return res.json({ success: true, data: webhook });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return res.status(500).json({ error: 'Failed to create webhook' });
  }
});

/**
 * GET /api/webhooks
 * Get all webhooks for authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhooks = await webhookService.getWebhooks(userId);

    // Don't expose secret key in response
    const safeWebhooks = webhooks.map((webhook) => ({
      ...webhook,
      secret: webhook.secret.substring(0, 8) + '...',
    }));

    return res.json({ success: true, webhooks: safeWebhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

/**
 * GET /api/webhooks/:id
 * Get webhook by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id as string;

    const webhook = await webhookService.getWebhookById(webhookId);

    if (!webhook || webhook.user_id !== userId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Don't expose secret key in response
    const safeWebhook = {
      ...webhook,
      secret: webhook.secret.substring(0, 8) + '...',
    };

    return res.json({ success: true, data: safeWebhook });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update webhook
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id as string;
    const { name, url, events, is_active } = req.body;

    // Verify ownership
    const existingWebhook = await webhookService.getWebhookById(webhookId);
    if (!existingWebhook || existingWebhook.user_id !== userId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }

    // Validate events if provided
    if (events && Array.isArray(events)) {
      const validEvents = [
        'dm.received',
        'comment.created',
        'comment.replied',
        'follow.new',
        'follow.removed',
        'mention.created',
        'like.added',
        'media.published',
        'media.scheduled',
      ];

      const invalidEvents = events.filter((event: string) => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return res.status(400).json({ 
          error: `Invalid events: ${invalidEvents.join(', ')}` 
        });
      }
    }

    const updatedWebhook = await webhookService.updateWebhook(webhookId, userId, {
      name,
      url,
      events,
      is_active,
    });

    return res.json({ success: true, data: updatedWebhook });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return res.status(500).json({ error: 'Failed to update webhook' });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id as string;

    // Verify ownership
    const existingWebhook = await webhookService.getWebhookById(webhookId);
    if (!existingWebhook || existingWebhook.user_id !== userId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const deleted = await webhookService.deleteWebhook(webhookId, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    return res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

/**
 * POST /api/webhooks/:id/trigger
 * Test webhook trigger
 */
router.post('/:id/trigger', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id as string;
    const { event_type, payload } = req.body;

    if (!event_type || !payload) {
      return res.status(400).json({ error: 'Missing event_type or payload' });
    }

    // Verify ownership
    const webhook = await webhookService.getWebhookById(webhookId);
    if (!webhook || webhook.user_id !== userId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Create test event
    const testEvent = {
      id: `test_${Date.now()}`,
      type: event_type,
      timestamp: Date.now(),
      data: payload,
    };

    // Trigger webhook
    const logId = await webhookService.createWebhookLog(webhook.id!, event_type, payload);
    const webhookDeliveryEngine = await import('../../services/webhookDeliveryEngine');
    
    await webhookDeliveryEngine.default.deliverWebhook(webhook, testEvent, logId);

    return res.json({ success: true, message: 'Webhook triggered successfully' });
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return res.status(500).json({ error: 'Failed to trigger webhook' });
  }
});

/**
 * GET /api/webhooks/:id/logs
 * Get webhook delivery logs
 */
router.get('/:id/logs', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const webhookId = req.params.id as string;
    const { page = 1, limit = 20 } = req.query;

    // Verify ownership
    const webhook = await webhookService.getWebhookById(webhookId);
    if (!webhook || webhook.user_id !== userId) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const logs = await webhookService.getWebhookLogs(
      webhookId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

/**
 * POST /api/webhooks/instagram/callback
 * Instagram Graph API webhook callback (public endpoint, no auth)
 */
router.post('/instagram/callback', async (req: any, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    // TODO: Verify signature (need to store Instagram webhook secrets)
    // For now, we'll accept all webhooks

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Process each entry
    for (const item of entry) {
      const { id, changes, time } = item;

      if (!changes || !Array.isArray(changes)) {
        continue;
      }

      for (const change of changes) {
        const { field, value } = change;

        // Handle different webhook events
        if (field === 'messages') {
          // New DM received
          // TODO: Extract user_id from webhook data and trigger dm.received event
          console.log('New DM received:', value);
        } else if (field === 'comments') {
          // New comment received
          // TODO: Extract user_id from webhook data and trigger comment.created event
          console.log('New comment received:', value);
        } else if (field === 'mentions') {
          // New mention
          // TODO: Extract user_id from webhook data and trigger mention.created event
          console.log('New mention received:', value);
        } else if (field === 'likes') {
          // New like
          // TODO: Extract user_id from webhook data and trigger like.added event
          console.log('New like received:', value);
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Instagram webhook:', error);
    // Always return 200 to Instagram to avoid retries
    return res.status(200).send('OK');
  }
});

/**
 * GET /api/webhooks/instagram/callback
 * Instagram Graph API webhook verification (public endpoint, no auth)
 */
router.get('/instagram/callback', (req: any, res: Response) => {
  const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } = req.query;

  if (mode === 'subscribe' && verifyToken === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    console.log('Instagram webhook verified');
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Forbidden');
});

export default router;
