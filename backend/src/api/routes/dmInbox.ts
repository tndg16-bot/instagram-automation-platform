import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import DMAutoReplyService from '../../services/dmAutoReplyService';
import { getInstagramAccessToken } from '../../utils/tokenManager';

const router = Router();
const dmAutoReplyService = new DMAutoReplyService();

router.use(authenticate);

/**
 * GET /api/dm/inbox
 * Get all DMs for authenticated user
 */
router.get('/inbox', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0 } = req.query;

    const dms = await dmAutoReplyService.getAllDMs(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return res.json({ success: true, dms });
  } catch (error) {
    console.error('Error fetching DMs:', error);
    return res.status(500).json({ error: 'Failed to fetch DMs' });
  }
});

/**
 * GET /api/dm/inbox/stats
 * Get DM statistics for authenticated user
 */
router.get('/inbox/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await dmAutoReplyService.getDMStats(userId);

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching DM stats:', error);
    return res.status(500).json({ error: 'Failed to fetch DM stats' });
  }
});

/**
 * POST /api/dm/inbox/process
 * Process DM from webhook (internal use)
 */
router.post('/inbox/process', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      message_id,
      sender_id,
      sender_username,
      recipient_id,
      text,
      media_url,
      media_type,
    } = req.body;

    if (!message_id || !sender_id || !sender_username || !recipient_id || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dm = await dmAutoReplyService.processDMWebhookEvent(
      {
        message_id,
        sender_id,
        sender_username,
        recipient_id,
        text,
        media_url: media_url || null,
        media_type: media_type || 'IMAGE',
      } as any,
      userId
    );

    return res.json({ success: true, data: dm });
  } catch (error) {
    console.error('Error processing DM webhook event:', error);
    return res.status(500).json({ error: 'Failed to process DM webhook event' });
  }
});

/**
 * PUT /api/dm/inbox/:id
 * Update DM status (pending, replied, ignored)
 */
router.put('/inbox/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dmId = req.params.id as string;
    const { status } = req.body;

    if (!status || !['pending', 'replied', 'ignored', 'processing'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'replied') {
      const { reply_message_id } = req.body;
      await dmAutoReplyService.markDMAsReplied(dmId, reply_message_id as string);
    } else if (status === 'ignored') {
      await dmAutoReplyService.markDMArIgnored(dmId);
    } else {
      await dmAutoReplyService.updateDMStatus(dmId, status as any);
    }

    return res.json({ success: true, message: 'DM status updated' });
  } catch (error) {
    console.error('Error updating DM status:', error);
    return res.status(500).json({ error: 'Failed to update DM status' });
  }
});

/**
 * POST /api/dm/auto-reply
 * Trigger auto-reply to pending DMs
 */
router.post('/auto-reply', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { instagram_account_id } = req.body;

    if (!instagram_account_id) {
      return res.status(400).json({ error: 'Missing instagram_account_id' });
    }

    const repliedCount = await dmAutoReplyService.autoReplyToDMs(userId, instagram_account_id);

    return res.json({
      success: true,
      data: {
        replied_count: repliedCount,
        message: `Replied to ${repliedCount} DMs`,
      },
    });
  } catch (error) {
    console.error('Error triggering DM auto-reply:', error);
    return res.status(500).json({ error: 'Failed to trigger DM auto-reply' });
  }
});

/**
 * DM Keyword Rules Management
 */

/**
 * POST /api/dm/keyword-rules
 * Create DM keyword rule
 */
router.post('/keyword-rules', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { keyword, reply_template_id } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Missing keyword' });
    }

    const rule = await dmAutoReplyService.createDMKeywordRule(
      userId,
      keyword.trim(),
      reply_template_id || null
    );

    return res.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error creating DM keyword rule:', error);
    return res.status(500).json({ error: 'Failed to create keyword rule' });
  }
});

/**
 * GET /api/dm/keyword-rules
 * Get all DM keyword rules
 */
router.get('/keyword-rules', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rules = await dmAutoReplyService.getAllDMKeywordRules(userId);

    return res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching DM keyword rules:', error);
    return res.status(500).json({ error: 'Failed to fetch keyword rules' });
  }
});

/**
 * PUT /api/dm/keyword-rules/:id
 * Update DM keyword rule
 */
router.put('/keyword-rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const ruleId = req.params.id as string;
    const { keyword, reply_template_id, is_active } = req.body;

    // Verify ownership
    const rules = await dmAutoReplyService.getAllDMKeywordRules(userId);
    const existingRule = rules.find((r: any) => r.id === ruleId);

    if (!existingRule || existingRule.user_id !== userId) {
      return res.status(404).json({ error: 'Keyword rule not found' });
    }

    await dmAutoReplyService.updateDMKeywordRule(
      ruleId,
      keyword || existingRule.keyword,
      reply_template_id !== undefined ? reply_template_id : existingRule.reply_template_id,
      is_active !== undefined ? is_active : existingRule.is_active
    );

    return res.json({ success: true, message: 'Keyword rule updated' });
  } catch (error) {
    console.error('Error updating DM keyword rule:', error);
    return res.status(500).json({ error: 'Failed to update keyword rule' });
  }
});

/**
 * DELETE /api/dm/keyword-rules/:id
 * Delete DM keyword rule
 */
router.delete('/keyword-rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const ruleId = req.params.id as string;

    // Verify ownership
    const rules = await dmAutoReplyService.getAllDMKeywordRules(userId);
    const existingRule = rules.find((r: any) => r.id === ruleId);

    if (!existingRule || existingRule.user_id !== userId) {
      return res.status(404).json({ error: 'Keyword rule not found' });
    }

    await dmAutoReplyService.deleteDMKeywordRule(ruleId);

    return res.json({ success: true, message: 'Keyword rule deleted' });
  } catch (error) {
    console.error('Error deleting DM keyword rule:', error);
    return res.status(500).json({ error: 'Failed to delete keyword rule' });
  }
});

export default router;
