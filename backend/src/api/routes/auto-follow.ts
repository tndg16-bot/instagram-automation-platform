import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import * as autoFollowService from '../../services/autoFollowService';

const router = Router();

/**
 * GET /api/auto/follow/settings
 * Get auto-follow settings
 */
router.get('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id } = req.query;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const settings = await autoFollowService.getAutoFollowSettings(
      userId,
      instagram_account_id as string
    );

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching auto-follow settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/**
 * POST /api/auto/follow/settings
 * Save auto-follow settings
 */
router.post('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      instagram_account_id,
      is_active,
      target_hashtags,
      target_locations,
      competitor_accounts,
      max_follows_per_day,
      max_unfollows_per_day,
      follow_delay_min,
      follow_delay_max,
      auto_unfollow_after_days,
      skip_private_accounts,
      skip_business_accounts,
      skip_verified_accounts,
    } = req.body;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const settings = await autoFollowService.saveAutoFollowSettings(userId, instagram_account_id, {
      is_active,
      target_hashtags,
      target_locations,
      competitor_accounts,
      max_follows_per_day,
      max_unfollows_per_day,
      follow_delay_min,
      follow_delay_max,
      auto_unfollow_after_days,
      skip_private_accounts,
      skip_business_accounts,
      skip_verified_accounts,
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error saving auto-follow settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

/**
 * GET /api/auto/follow/stats
 * Get auto-follow statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id } = req.query;

    if (!userId || !instagram_account_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const [followCount, unfollowCount] = await Promise.all([
      autoFollowService.getTodayActionCount(userId, instagram_account_id as string, 'follow'),
      autoFollowService.getTodayActionCount(userId, instagram_account_id as string, 'unfollow'),
    ]);

    res.json({
      success: true,
      data: {
        today_follow_count: followCount,
        today_unfollow_count: unfollowCount,
      },
    });
  } catch (error) {
    console.error('Error fetching auto-follow stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/auto/follow/execute
 * Manually trigger auto-follow
 */
router.post('/execute', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id, access_token } = req.body;

    if (!userId || !instagram_account_id || !access_token) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const result = await autoFollowService.executeAutoFollow(
      userId,
      instagram_account_id,
      access_token
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing auto-follow:', error);
    res.status(500).json({ success: false, error: 'Failed to execute' });
  }
});

/**
 * POST /api/auto/follow/unfollow
 * Manually trigger auto-unfollow
 */
router.post('/unfollow', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { instagram_account_id, access_token } = req.body;

    if (!userId || !instagram_account_id || !access_token) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const result = await autoFollowService.executeAutoUnfollow(
      userId,
      instagram_account_id,
      access_token
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing auto-unfollow:', error);
    res.status(500).json({ success: false, error: 'Failed to execute' });
  }
});

export default router;
