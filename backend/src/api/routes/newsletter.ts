import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

interface NewsletterCampaign {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  description: string | null;
  content_template_id: string | null;
  scheduled_at: Date | null;
  sent_at: Date | null;
  status: string;
  target_audience: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
}

interface NewsletterTemplate {
  id: string;
  user_id: string;
  name: string;
  subject_template: string;
  content_template: string;
  template_variables: any;
  is_html: boolean;
  design_config: any;
  preview_html: string | null;
  preview_text: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  user_id: string | null;
  status: string;
  tags: string[];
}

// GET /api/newsletter/campaigns - List campaigns
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = ((page as number) - 1) * (limit as number);
    
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    const result = await query(
      `SELECT * FROM newsletter_campaigns
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM newsletter_campaigns ${whereClause}`,
      [userId, status || ''].filter(Boolean)
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error listing campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to list campaigns' });
  }
});

// POST /api/newsletter/campaigns - Create new campaign
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, subject, description, content_template_id, scheduled_at, target_audience } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ success: false, error: 'Name and subject are required' });
    }

    const result = await query(
      `INSERT INTO newsletter_campaigns (user_id, name, subject, description, content_template_id, scheduled_at, status, target_audience, total_recipients, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, name, subject, description || null, content_template_id || null, scheduled_at || null, JSON.stringify(target_audience || {})]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// GET /api/newsletter/campaigns/:id - Get campaign details
router.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM newsletter_campaigns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error getting campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaign' });
  }
});

// PUT /api/newsletter/campaigns/:id - Update campaign
router.put('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { name, subject, description, content_template_id, scheduled_at, target_audience, status } = req.body;

    const result = await query(
      'SELECT * FROM newsletter_campaigns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 3;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`);
      values.push(subject);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (content_template_id !== undefined) {
      updates.push(`content_template_id = $${paramIndex++}`);
      values.push(content_template_id);
    }
    if (scheduled_at !== undefined) {
      updates.push(`scheduled_at = $${paramIndex++}`);
      values.push(scheduled_at);
    }
    if (target_audience !== undefined) {
      updates.push(`target_audience = $${paramIndex++}`);
      values.push(JSON.stringify(target_audience));
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    values.push(id);
    const queryStr = `UPDATE newsletter_campaigns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;

    const updateResult = await query(queryStr, values);

    res.json({
      success: true,
      data: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, error: "Failed to update campaign" });
  }
});

// DELETE /api/newsletter/campaigns/:id - Delete campaign
router.delete('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM newsletter_campaigns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    await query('DELETE FROM newsletter_logs WHERE campaign_id = $1', [id]);
    await query('DELETE FROM newsletter_schedule WHERE campaign_id = $1', [id]);
    await query('DELETE FROM newsletter_campaigns WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
});

// POST /api/newsletter/campaigns/:id/send - Send campaign immediately
router.post('/campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM newsletter_campaigns WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const campaign = result.rows[0];

    // Get target audience
    const targetAudience = campaign.target_audience ? JSON.parse(campaign.target_audience) : {};
    const { tags, custom_segments } = targetAudience;

    let whereClause = 'WHERE status = $1';
    const params: any[] = ['active'];
    let paramIndex = 2;

    if (tags && tags.length > 0) {
      whereClause += ` AND tags && $${paramIndex++}`;
      params.push(tags);
    }

    if (custom_segments && custom_segments.length > 0) {
      whereClause += ` AND custom_segments @> $${paramIndex++}`;
      params.push(custom_segments);
    }

    const subscribersResult = await query(
      `SELECT * FROM newsletter_subscribers ${whereClause}`,
      params
    );

    const subscribers = subscribersResult.rows;
    const subscriberIds = subscribers.map((s: any) => s.id);

    // Create logs for each subscriber
    const logsValues = subscribers.map((s: any) => [id, s.id, 'pending', null]);
    await query(
      `INSERT INTO newsletter_logs (campaign_id, subscriber_id, status, created_at)
       VALUES ${logsValues.map(() => '($1, $2, $3, $4, CURRENT_TIMESTAMP)').join(', ')}`,
      [id].concat(...subscriberIds)
    );

    // Update campaign status
    await query(
      `UPDATE newsletter_campaigns
       SET status = 'sent',
           total_recipients = $1,
           total_sent = $2,
           sent_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [subscribers.length, subscribers.length, id]
    );

    res.json({
      success: true,
      message: `Campaign sent to ${subscribers.length} subscribers`,
      data: {
        total_recipients: subscribers.length,
        total_sent: subscribers.length,
      },
    });
  } catch (error: any) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to send campaign' });
  }
});

// GET /api/newsletter/templates - List templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT * FROM newsletter_templates WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error listing templates:', error);
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

// POST /api/newsletter/templates - Create new template
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, subject_template, content_template, template_variables, is_html, design_config } = req.body;

    if (!name || !subject_template || !content_template) {
      return res.status(400).json({ success: false, error: 'Name, subject template, and content template are required' });
    }

    const result = await query(
      `INSERT INTO newsletter_templates (user_id, name, subject_template, content_template, template_variables, is_html, design_config, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, name, subject_template, content_template, JSON.stringify(template_variables || {}), is_html !== undefined ? is_html : true, JSON.stringify(design_config || {})]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// GET /api/newsletter/subscribers - List subscribers
router.get('/subscribers', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const offset = ((page as number) - 1) * (limit as number);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (email ILIKE $${params.length + 1} OR user_id::text ILIKE $${params.length + 1})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const result = await query(
      `SELECT * FROM newsletter_subscribers ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.rows.length,
        has_more: result.rows.length === Number(limit),
      },
    });
  } catch (error: any) {
    console.error('Error listing subscribers:', error);
    res.status(500).json({ success: false, error: 'Failed to list subscribers' });
  }
});

// POST /api/newsletter/subscribers - Add subscriber
router.post('/subscribers', async (req: Request, res: Response) => {
  try {
    const { email, user_id, tags, subscription_source } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if subscriber already exists
    const existingResult = await query(
      'SELECT * FROM newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already subscribed' });
    }

    const result = await query(
      `INSERT INTO newsletter_subscribers (email, user_id, tags, subscription_source, status, subscribed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [email, user_id || null, tags ? JSON.stringify(tags) : null, subscription_source || 'manual', 'active']
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error adding subscriber:', error);
    res.status(500).json({ success: false, error: 'Failed to add subscriber' });
  }
});

// DELETE /api/newsletter/subscribers/:id - Remove subscriber
router.delete('/subscribers/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'UPDATE newsletter_subscribers SET status = $1, unsubscribed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['unsubscribed', id]
    );

    res.json({
      success: true,
      message: 'Subscriber removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing subscriber:', error);
    res.status(500).json({ success: false, error: 'Failed to remove subscriber' });
  }
});

// GET /api/newsletter/analytics - Get campaign analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { campaign_id, start_date, end_date } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (campaign_id) {
      whereClause += ` AND campaign_id = $${params.length + 1}`;
      params.push(campaign_id);
    }

    if (start_date) {
      whereClause += ` AND date >= $${params.length + 1}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }

    const result = await query(
      `SELECT * FROM newsletter_analytics ${whereClause} ORDER BY date DESC`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

export default router;
