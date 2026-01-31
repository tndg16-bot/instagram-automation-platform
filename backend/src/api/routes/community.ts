import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import * as communityService from '../../services/communityService';

const router = Router();

/**
 * GET /api/community/topics
 * Get all community topics
 */
router.get('/topics', async (req: AuthRequest, res: Response) => {
  try {
    const { category, tag, sortBy, page, limit } = req.query;
    
    const result = await communityService.getTopics({
      category: category as string,
      tag: tag as string,
      sortBy: sortBy as 'latest' | 'popular' | 'unanswered',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topics' });
  }
});

/**
 * POST /api/community/topics
 * Create new topic
 */
router.post('/topics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { title, description, category, tags } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({ success: false, error: 'Title and category are required' });
    }

    const topic = await communityService.createTopic(userId, {
      title,
      description,
      category,
      tags
    });
    
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ success: false, error: 'Failed to create topic' });
  }
});

/**
 * GET /api/community/topics/:id
 * Get topic by ID with posts
 */
router.get('/topics/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await communityService.getTopicById(id);
    
    if (!result.topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topic' });
  }
});

/**
 * POST /api/community/topics/:id/posts
 * Create post in topic
 */
router.post('/topics/:id/posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content, parent_post_id } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const post = await communityService.createPost(id, userId, {
      content,
      parent_post_id
    });
    
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

export default router;
