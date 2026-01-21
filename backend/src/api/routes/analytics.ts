import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import AnalyticsService from '../../services/analyticsService';

const router = Router();
const analyticsService = new AnalyticsService();

router.use(authenticate);

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard summary
 */
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const summary = await analyticsService.getDashboardSummary(userId);

    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

/**
 * GET /api/analytics/engagement
 * Get user engagement metrics
 */
router.get('/engagement', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { period = '30d' } = req.query;

    const metrics = await analyticsService.getUserEngagementMetrics(userId, period as '7d' | '30d' | '90d');

    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

/**
 * GET /api/analytics/content
 * Get content performance metrics
 */
router.get('/content', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 20 } = req.query;

    const metrics = await analyticsService.getContentPerformance(userId, parseInt(limit as string));

    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching content performance:', error);
    return res.status(500).json({ error: 'Failed to fetch content performance' });
  }
});

/**
 * GET /api/analytics/dm-campaigns
 * Get DM campaign performance
 */
router.get('/dm-campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 20 } = req.query;

    const metrics = await analyticsService.getDMCampaignPerformance(userId, parseInt(limit as string));

    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching DM campaign performance:', error);
    return res.status(500).json({ error: 'Failed to fetch DM campaign performance' });
  }
});

/**
 * GET /api/analytics/growth
 * Get growth metrics over time
 */
router.get('/growth', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { period = 'monthly' } = req.query;

    const metrics = await analyticsService.getGrowthMetrics(userId, period as 'daily' | 'weekly' | 'monthly');

    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch growth metrics' });
  }
});

/**
 * GET /api/analytics/audience
 * Get audience demographics
 */
router.get('/audience', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const demographics = await analyticsService.getAudienceDemographics(userId);

    return res.json({ success: true, data: demographics });
  } catch (error) {
    console.error('Error fetching audience demographics:', error);
    return res.status(500).json({ error: 'Failed to fetch audience demographics' });
  }
});

/**
 * GET /api/analytics/top-posts
 * Get top performing posts
 */
router.get('/top-posts', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;

    const posts = await analyticsService.getTopPerformingPosts(userId, parseInt(limit as string));

    return res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Error fetching top performing posts:', error);
    return res.status(500).json({ error: 'Failed to fetch top performing posts' });
  }
});

export default router;
