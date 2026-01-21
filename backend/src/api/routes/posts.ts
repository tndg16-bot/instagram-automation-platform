import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import PostService from '../../services/postService';
import pool from '../../config/database';

const router = Router();
const postService = new PostService();

router.use(authenticate);

/**
 * POST /api/posts
 * Create draft post
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { instagram_account_id, media_type, media_urls, caption } = req.body;

    if (!instagram_account_id || !media_type || !media_urls || media_urls.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const post = await postService.createDraftPost(
      userId,
      instagram_account_id,
      media_type,
      media_urls,
      caption
    );

    return res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

/**
 * GET /api/posts
 * Get all posts for user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0 } = req.query;

    const posts = await postService.getAllPosts(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * POST /api/posts/:id/schedule
 * Schedule post for future date
 */
router.post('/:id/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id as string;
    const { scheduled_at } = req.body;

    if (!scheduled_at) {
      return res.status(400).json({ error: 'Missing scheduled_at' });
    }

    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    await postService.schedulePost(postId, scheduledDate);

    return res.json({ success: true, message: 'Post scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling post:', error);
    return res.status(500).json({ error: 'Failed to schedule post' });
  }
});

/**
 * POST /api/posts/:id/publish
 * Publish post immediately
 */
router.post('/:id/publish', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id as string;

    const mediaId = await postService.publishPost(postId);

    return res.json({
      success: true,
      data: {
        media_id: mediaId,
        message: 'Post published successfully',
      },
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    return res.status(500).json({ error: 'Failed to publish post' });
  }
});

/**
 * PUT /api/posts/:id
 * Update post details
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id as string;
    const { caption, media_urls } = req.body;

    // Update post in database
    // Note: This is a simplified version - in production, you'd implement full update logic
    await pool.query(
      'UPDATE scheduled_posts SET caption = $2, media_urls = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [caption, JSON.stringify(media_urls), postId]
    );

    return res.json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete or cancel scheduled post
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id as string;

    await postService.deletePost(postId);

    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

/**
 * Post Templates Management
 */

/**
 * POST /api/posts/templates
 * Create post template
 */
router.post('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { template_name, caption, media_urls } = req.body;

    if (!template_name || !caption) {
      return res.status(400).json({ error: 'Missing template_name or caption' });
    }

    const template = await postService.createPostTemplate(
      userId,
      template_name,
      caption,
      media_urls || []
    );

    return res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating post template:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * GET /api/posts/templates
 * Get all post templates
 */
router.get('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templates = await postService.getAllPostTemplates(userId);

    return res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching post templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * DELETE /api/posts/templates/:id
 * Delete post template
 */
router.delete('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templateId = req.params.id as string;

    await postService.deletePostTemplate(templateId);

    return res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
