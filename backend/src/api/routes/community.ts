import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  author_id: string;
  created_at: Date;
  updated_at: Date;
  reply_count: number;
  view_count: number;
}

interface Reply {
  id: string;
  topic_id: string;
  parent_id: string | null;
  content: string;
  author_id: string;
  created_at: Date;
}

// GET /api/community/topics - List topics
router.get('/topics', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, sort = 'recent' } = req.query;
    const offset = ((page as number) - 1) * (limit as number);

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += `WHERE t.category = $${paramIndex++}`;
      params.push(category);
    }

    let orderByClause = '';
    switch (sort) {
      case 'recent':
        orderByClause = 'ORDER BY t.created_at DESC';
        break;
      case 'popular':
        orderByClause = 'ORDER BY t.view_count DESC';
        break;
      case 'active':
        orderByClause = 'ORDER BY t.reply_count DESC';
        break;
      default:
        orderByClause = 'ORDER BY t.created_at DESC';
    }

    const result = await query(
      `SELECT t.*, u.username as author_name, u.avatar_url as author_avatar
       FROM topics t
       JOIN users u ON t.author_id = u.id
       ${whereClause}
       ${orderByClause}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM topics t ${whereClause}`,
      params
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
    console.error('Error getting topics:', error);
    res.status(500).json({ success: false, error: 'Failed to get topics' });
  }
});

// POST /api/community/topics - Create new topic
router.post('/topics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { title, description, category } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    const result = await query(
      `INSERT INTO topics (title, description, category, author_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, category || 'general', userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating topic:', error);
    res.status(500).json({ success: false, error: 'Failed to create topic' });
  }
});

// GET /api/community/topics/:id - Get topic with replies
router.get('/topics/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const topicResult = await query(
      `SELECT t.*, u.username as author_name, u.avatar_url as author_avatar
       FROM topics t
       JOIN users u ON t.author_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (topicResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const topic = topicResult.rows[0];

    // Increment view count
    await query(
      'UPDATE topics SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    // Get replies
    const repliesResult = await query(
      `SELECT r.*, u.username as author_name, u.avatar_url as author_avatar
       FROM replies r
       JOIN users u ON r.author_id = u.id
       WHERE r.topic_id = $1
       ORDER BY r.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        topic,
        replies: repliesResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Error getting topic:', error);
    res.status(500).json({ success: false, error: 'Failed to get topic' });
  }
});

// POST /api/community/topics/:id/replies - Reply to topic
router.post('/topics/:id/replies', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const result = await query(
      `INSERT INTO replies (topic_id, content, author_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, content, userId, parent_id || null]
    );

    // Update topic reply count
    await query(
      'UPDATE topics SET reply_count = reply_count + 1 WHERE id = $1',
      [id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating reply:', error);
    res.status(500).json({ success: false, error: 'Failed to create reply' });
  }
});

// POST /api/community/replies/:id/replies - Reply to a reply (nested)
router.post('/replies/:id/replies', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: parentId } = req.params;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // Get parent reply to get topic_id
    const parentResult = await query(
      'SELECT topic_id FROM replies WHERE id = $1',
      [parentId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }

    const topicId = parentResult.rows[0].topic_id;

    const result = await query(
      `INSERT INTO replies (topic_id, content, author_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [topicId, content, userId, parentId]
    );

    // Update topic reply count
    await query(
      'UPDATE topics SET reply_count = reply_count + 1 WHERE id = $1',
      [topicId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating nested reply:', error);
    res.status(500).json({ success: false, error: 'Failed to create nested reply' });
  }
});

export default router;
