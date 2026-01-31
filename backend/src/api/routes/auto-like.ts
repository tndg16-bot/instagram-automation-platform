import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import * as autoLikeService from '../../services/autoLikeService';

const router = Router();

/**
 * GET /api/auto/like/settings
 * Get auto-like settings
 */
router.get('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id } = req.query;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const settings = await autoLikeService.getAutoLikeSettings(
      userId,
      instagram_account_id as string
    );

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching auto-like settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/auto/like/settings
 * Save auto-like settings
 */
router.post('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      instagram_account_id,
      is_active,
      target_hashtags,
      target_accounts,
      max_likes_per_day,
      like_delay_min,
      like_delay_max,
      skip_private_accounts,
      skip_business_accounts,
    } = req.body;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const settings = await autoLikeService.saveAutoLikeSettings(userId, instagram_account_id, {
      is_active,
      target_hashtags,
      target_accounts,
      max_likes_per_day,
      like_delay_min,
      like_delay_max,
      skip_private_accounts,
      skip_business_accounts,
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error saving auto-like settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

/**
 * GET /api/auto/like/stats
 * Get auto-like statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id, days = 7 } = req.query;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const [todayCount, stats] = await Promise.all([
      autoLikeService.getTodayLikeCount(userId, instagram_account_id as string),
      autoLikeService.getLikeStats(userId, instagram_account_id as string, parseInt(days as string)),
    ]);

    res.json({
      success: true,
      data: {
        today_count: todayCount,
        history: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching auto-like stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/auto/like/execute
 * Manually trigger auto-like (for testing)
 */
router.post('/execute', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id, access_token } = req.body;

    if (!userId || !instagram_account_id || !access_token) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const result = await autoLikeService.executeAutoLike(
      userId,
      instagram_account_id,
      access_token
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing auto-like:', error);
    res.status(500).json({ success: false, error: 'Failed to execute' });
  }
});

export default router;
