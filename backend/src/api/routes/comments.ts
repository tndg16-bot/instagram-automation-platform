import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import CommentService from '../../services/commentService';
import InstagramGraphClient from '../../services/instagramClient';
import { getInstagramAccessToken } from '../../utils/tokenManager';

const router = Router();
const commentService = new CommentService();

router.use(authenticate);

/**
 * GET /api/comments
 * Get all comments for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0, media_id } = req.query;

    if (media_id) {
      const comments = await commentService.getCommentsByMediaId(userId, media_id as string);
      return res.json({ success: true, comments });
    }

    const comments = await commentService.getAllComments(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * GET /api/comments/stats
 * Get comment statistics for the authenticated user
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await commentService.getCommentStats(userId);

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    return res.status(500).json({ error: 'Failed to fetch comment stats' });
  }
});

/**
 * POST /api/comments/fetch
 * Fetch comments from Instagram for a specific media
 */
router.post('/fetch', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { media_id, instagram_account_id } = req.body;

    if (!media_id || !instagram_account_id) {
      return res.status(400).json({ error: 'Missing media_id or instagram_account_id' });
    }

    // Get Instagram access token from account
    const accessToken = await getInstagramAccessToken(userId, instagram_account_id);

    // Fetch and save comments
    await commentService.fetchAndSaveComments(media_id, accessToken, userId);

    return res.json({ success: true, message: 'Comments fetched successfully' });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/comments/:id/reply
 * Reply to a comment
 */
router.post('/:id/reply', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const commentId = req.params.id as string;
    const { message, template_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Get Instagram access token
    const accessToken = await getInstagramAccessToken(userId);

    const client = new InstagramGraphClient(accessToken);
    await client.replyToComment(commentId, message);

    // Mark as replied (use commentId as replyMessageId for tracking)
    await commentService.markCommentAsReplied(commentId, commentId);

    return res.json({
      success: true,
      data: {
        reply_id: commentId,
        message: 'Reply sent successfully',
      },
    });
  } catch (error) {
    console.error('Error replying to comment:', error);
    return res.status(500).json({ error: 'Failed to send reply' });
  }
});

/**
 * PUT /api/comments/:id
 * Update comment status (pending, replied, ignored)
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const commentId = req.params.id as string;
    const { status } = req.body;

    if (!status || !['pending', 'replied', 'ignored'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'replied') {
      const { reply_message_id } = req.body;
      await commentService.markCommentAsReplied(commentId, reply_message_id as string);
    } else if (status === 'ignored') {
      await commentService.markCommentAsIgnored(commentId);
    }

    return res.json({ success: true, message: 'Comment status updated' });
  } catch (error) {
    console.error('Error updating comment status:', error);
    return res.status(500).json({ error: 'Failed to update comment status' });
  }
});

/**
 * POST /api/comments/templates
 * Create reply template
 */
router.post('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { template_name, content } = req.body;

    if (!template_name || !content) {
      return res.status(400).json({ error: 'Missing template_name or content' });
    }

    const template = await commentService.createReplyTemplate(userId, template_name, content);

    return res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating reply template:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * GET /api/comments/templates
 * Get all reply templates
 */
router.get('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templates = await commentService.getAllReplyTemplates(userId);

    return res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * PUT /api/comments/templates/:id
 * Update reply template
 */
router.put('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templateId = req.params.id as string;
    const { template_name, content, is_active } = req.body;

    const template = await commentService.getReplyTemplate(userId, templateId);

    if (!template || template.user_id !== userId) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await commentService.updateReplyTemplate(templateId, template_name || template.template_name, content || template.content, is_active !== undefined ? is_active : template.is_active);

    return res.json({ success: true, message: 'Template updated' });
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/comments/templates/:id
 * Delete reply template
 */
router.delete('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templateId = req.params.id as string;

    const template = await commentService.getReplyTemplate(userId, templateId);

    if (!template || template.user_id !== userId) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await commentService.deleteReplyTemplate(templateId);

    return res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Failed to delete template' });
  }
});

/**
 * POST /api/comments/keywords
 * Create keyword rule
 */
router.post('/keywords', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Missing keyword' });
    }

    const rule = await commentService.createKeywordRule(userId, keyword.trim());

    return res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error creating keyword rule:', error);
    return res.status(500).json({ error: 'Failed to create keyword rule' });
  }
});

/**
 * GET /api/comments/keywords
 * Get all keyword rules
 */
router.get('/keywords', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rules = await commentService.getAllKeywordRules(userId);

    return res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching keyword rules:', error);
    return res.status(500).json({ error: 'Failed to fetch keyword rules' });
  }
});

/**
 * PUT /api/comments/keywords/:id
 * Update keyword rule
 */
router.put('/keywords/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const ruleId = req.params.id as string;
    const { keyword, is_active } = req.body;

    // Get rule to verify ownership
    const rule = await commentService.getMatchingKeywordRules(userId, keyword || '');
    const existingRule = rule.find((r: any) => r.id === ruleId);

    if (!existingRule || existingRule.user_id !== userId) {
      return res.status(404).json({ error: 'Keyword rule not found' });
    }

    await commentService.updateKeywordRule(ruleId, keyword || '', is_active !== undefined ? is_active : true);

    return res.json({ success: true, message: 'Keyword rule updated' });
  } catch (error) {
    console.error('Error updating keyword rule:', error);
    return res.status(500).json({ error: 'Failed to update keyword rule' });
  }
});

/**
 * DELETE /api/comments/keywords/:id
 * Delete keyword rule
 */
router.delete('/keywords/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const ruleId = req.params.id as string;

    // Verify ownership before deletion
    const rules = await commentService.getAllKeywordRules(userId);
    const existingRule = rules.find((r: any) => r.id === ruleId);

    if (!existingRule) {
      return res.status(404).json({ error: 'Keyword rule not found' });
    }

    await commentService.deleteKeywordRule(ruleId);

    return res.json({ success: true, message: 'Keyword rule deleted' });
  } catch (error) {
    console.error('Error deleting keyword rule:', error);
    return res.status(500).json({ error: 'Failed to delete keyword rule' });
  }
});

/**
 * POST /api/comments/auto-reply
 * Trigger auto-reply to pending comments
 */
router.post('/auto-reply', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { instagram_account_id } = req.body;

    if (!instagram_account_id) {
      return res.status(400).json({ error: 'Missing instagram_account_id' });
    }

    // Get Instagram access token
    const accessToken = await getInstagramAccessToken(userId, instagram_account_id);

    const repliedCount = await commentService.autoReplyToComments(accessToken, userId);

    return res.json({
      success: true,
      data: {
        replied_count: repliedCount,
        message: `Replied to ${repliedCount} comments`,
      },
    });
  } catch (error) {
    console.error('Error triggering auto-reply:', error);
    return res.status(500).json({ error: 'Failed to trigger auto-reply' });
  }
});

export default router;
