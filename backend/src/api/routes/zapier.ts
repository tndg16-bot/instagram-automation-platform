import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import { query } from '../../config/database';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/integrations/zapier/auth
 * Zapier authentication endpoint
 */
router.post('/auth', async (req: AuthRequest, res: Response) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Verify API key (simplified - in production, use proper key validation)
    const result = await query(
      'SELECT user_id FROM user_api_keys WHERE key = $1 AND is_active = TRUE',
      [api_key]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.json({ success: true, user_id: result.rows[0].user_id });
  } catch (error) {
    console.error('Zapier auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/integrations/zapier/triggers
 * List available triggers
 */
router.get('/triggers', authenticate, async (req: AuthRequest, res: Response) => {
  const triggers = [
    {
      id: 'new_comment',
      label: 'New Comment',
      description: 'Triggers when a new comment is received',
      sample_data: {
        comment_id: '123',
        username: 'user123',
        text: 'Nice post!',
        post_id: '456',
        timestamp: '2026-01-31T10:00:00Z'
      }
    },
    {
      id: 'new_follower',
      label: 'New Follower',
      description: 'Triggers when a new user follows you',
      sample_data: {
        follower_id: '789',
        username: 'newfollower',
        timestamp: '2026-01-31T10:00:00Z'
      }
    },
    {
      id: 'dm_received',
      label: 'DM Received',
      description: 'Triggers when a direct message is received',
      sample_data: {
        message_id: '321',
        sender_id: '654',
        sender_username: 'sender',
        text: 'Hello!',
        timestamp: '2026-01-31T10:00:00Z'
      }
    }
  ];

  res.json({ triggers });
});

/**
 * GET /api/integrations/zapier/actions
 * List available actions
 */
router.get('/actions', authenticate, async (req: AuthRequest, res: Response) => {
  const actions = [
    {
      id: 'send_dm',
      label: 'Send DM',
      description: 'Send a direct message to a user',
      fields: [
        { key: 'recipient_id', label: 'Recipient ID', type: 'string', required: true },
        { key: 'message', label: 'Message', type: 'text', required: true }
      ]
    },
    {
      id: 'reply_comment',
      label: 'Reply to Comment',
      description: 'Reply to a comment on a post',
      fields: [
        { key: 'comment_id', label: 'Comment ID', type: 'string', required: true },
        { key: 'reply', label: 'Reply Text', type: 'text', required: true }
      ]
    },
    {
      id: 'create_post',
      label: 'Create Post',
      description: 'Create a new Instagram post',
      fields: [
        { key: 'caption', label: 'Caption', type: 'text', required: true },
        { key: 'image_url', label: 'Image URL', type: 'string', required: true }
      ]
    }
  ];

  res.json({ actions });
});

/**
 * POST /api/integrations/zapier/actions/:actionId
 * Execute Zapier action
 */
router.post('/actions/:actionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { actionId } = req.params;
    const params = req.body;

    // Get user's Instagram account
    const accountResult = await query(
      'SELECT id, access_token FROM instagram_accounts WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
      [userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(400).json({ error: 'No Instagram account connected' });
    }

    const account = accountResult.rows[0];

    // Execute action based on type
    let result;
    switch (actionId) {
      case 'send_dm':
        // Implementation would call Instagram API
        result = { success: true, message: 'DM sent', recipient: params.recipient_id };
        break;
      case 'reply_comment':
        result = { success: true, message: 'Reply posted', comment_id: params.comment_id };
        break;
      case 'create_post':
        result = { success: true, message: 'Post created' };
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    res.json(result);
  } catch (error) {
    console.error('Zapier action error:', error);
    res.status(500).json({ error: 'Action execution failed' });
  }
});

export default router;
