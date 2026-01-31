import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import { query } from '../../config/database';

const router = Router();

/**
 * GET /api/integrations/n8n/credentials
 * Get n8n credential schema
 */
router.get('/credentials', async (req: AuthRequest, res: Response) => {
  const credentials = {
    name: 'instaflowApi',
    displayName: 'InstaFlow API',
    documentationUrl: 'https://docs.instaflow.io',
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true
      },
      {
        displayName: 'Base URL',
        name: 'baseUrl',
        type: 'string',
        default: 'https://api.instaflow.io',
        required: true
      }
    ]
  };

  res.json(credentials);
});

/**
 * GET /api/integrations/n8n/node
 * Get n8n node definition
 */
router.get('/node', async (req: AuthRequest, res: Response) => {
  const node = {
    displayName: 'InstaFlow',
    name: 'instaflow',
    icon: 'file:instaflow.svg',
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with InstaFlow API',
    defaults: {
      name: 'InstaFlow'
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'instaflowApi',
        required: true
      }
    ],
    requestDefaults: {
      baseURL: '={{ $credentials.baseUrl }}',
      headers: {
        'X-API-Key': '={{ $credentials.apiKey }}'
      }
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'DM', value: 'dm' },
          { name: 'Comment', value: 'comment' },
          { name: 'Post', value: 'post' }
        ],
        default: 'dm'
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['dm'] }
        },
        options: [
          { name: 'Send', value: 'send', action: 'Send a DM' }
        ],
        default: 'send'
      },
      {
        displayName: 'Recipient ID',
        name: 'recipientId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { operation: ['send'], resource: ['dm'] }
        }
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: '',
        displayOptions: {
          show: { operation: ['send'], resource: ['dm'] }
        }
      }
    ]
  };

  res.json(node);
});

/**
 * POST /api/integrations/n8n/webhook
 * Webhook endpoint for n8n triggers
 */
router.post('/webhook/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { event, data } = req.body;

    // Verify user
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log event
    await query(
      'INSERT INTO n8n_webhook_logs (user_id, event_type, payload) VALUES ($1, $2, $3)',
      [userId, event, data]
    );

    res.json({ success: true, event, received: true });
  } catch (error) {
    console.error('n8n webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/integrations/n8n/triggers
 * List available n8n triggers
 */
router.get('/triggers', authenticate, async (req: AuthRequest, res: Response) => {
  const triggers = [
    {
      name: 'New Comment',
      key: 'instaflow.newComment',
      description: 'Triggers when a new comment is received',
      params: []
    },
    {
      name: 'New Follower',
      key: 'instaflow.newFollower',
      description: 'Triggers when a new user follows',
      params: []
    },
    {
      name: 'DM Received',
      key: 'instaflow.dmReceived',
      description: 'Triggers when a direct message is received',
      params: []
    }
  ];

  res.json({ triggers });
});

export default router;
