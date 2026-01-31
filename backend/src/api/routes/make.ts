import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import { query } from '../../config/database';

const router = Router();

/**
 * GET /api/integrations/make/modules
 * List available Make modules
 */
router.get('/modules', authenticate, async (req: AuthRequest, res: Response) => {
  const modules = {
    triggers: [
      {
        id: 'instaflow_new_comment',
        name: 'New Comment',
        description: 'Triggers when a new comment is received',
        webhook: true
      },
      {
        id: 'instaflow_new_follower',
        name: 'New Follower',
        description: 'Triggers when a new user follows',
        webhook: true
      },
      {
        id: 'instaflow_dm_received',
        name: 'DM Received',
        description: 'Triggers when a DM is received',
        webhook: true
      }
    ],
    actions: [
      {
        id: 'instaflow_send_dm',
        name: 'Send DM',
        description: 'Send a direct message',
        parameters: [
          { name: 'recipient_id', type: 'text', required: true },
          { name: 'message', type: 'text', required: true }
        ]
      },
      {
        id: 'instaflow_reply_comment',
        name: 'Reply to Comment',
        description: 'Reply to a comment',
        parameters: [
          { name: 'comment_id', type: 'text', required: true },
          { name: 'reply_text', type: 'text', required: true }
        ]
      },
      {
        id: 'instaflow_create_post',
        name: 'Create Post',
        description: 'Create a new post',
        parameters: [
          { name: 'caption', type: 'text', required: true },
          { name: 'image_url', type: 'url', required: true }
        ]
      }
    ]
  };

  res.json(modules);
});

/**
 * POST /api/integrations/make/webhook
 * Webhook for Make triggers
 */
router.post('/webhook/:userId/:triggerId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, triggerId } = req.params;
    const payload = req.body;

    // Verify user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log webhook call
    await query(
      'INSERT INTO make_webhook_logs (user_id, trigger_id, payload) VALUES ($1, $2, $3)',
      [userId, triggerId, payload]
    );

    res.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.error('Make webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/integrations/make/execute
 * Execute Make action
 */
router.post('/execute', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { module_id, parameters } = req.body;

    // Get Instagram account
    const accountResult = await query(
      'SELECT id FROM instagram_accounts WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
      [userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(400).json({ error: 'No Instagram account connected' });
    }

    // Execute module action
    // Implementation would call Instagram API
    res.json({
      success: true,
      module_id,
      executed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Make execution error:', error);
    res.status(500).json({ error: 'Execution failed' });
  }
});

export default router;
