import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import * as scheduledPostService from '../../services/scheduledPostService';

const router = Router();

/**
 * GET /api/scheduled-posts
 * List scheduled posts
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id, status } = req.query;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const posts = await scheduledPostService.getScheduledPosts(
      userId,
      instagram_account_id as string,
      status as string
    );

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch posts' });
  }
});

/**
 * POST /api/scheduled-posts
 * Create scheduled post
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      instagram_account_id,
      caption,
      media_type,
      media_urls,
      scheduled_at,
    } = req.body;

    if (!userId || !instagram_account_id || !caption || !media_type || !media_urls || !scheduled_at) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const post = await scheduledPostService.createScheduledPost(userId, instagram_account_id, {
      caption,
      media_type,
      media_urls,
      scheduled_at: new Date(scheduled_at),
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

/**
 * DELETE /api/scheduled-posts/:id
 * Delete scheduled post
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const deleted = await scheduledPostService.deleteScheduledPost(id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Post not found or cannot be deleted' });
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

/**
 * POST /api/scheduled-posts/process
 * Process pending posts (admin/cron endpoint)
 */
router.post('/process', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { batch_size = 10 } = req.body;

    const result = await scheduledPostService.processScheduledPosts(parseInt(batch_size));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
    res.status(500).json({ success: false, error: 'Failed to process posts' });
  }
});

export default router;
