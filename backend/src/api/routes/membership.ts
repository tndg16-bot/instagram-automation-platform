import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import * as membershipService from '../../services/membershipService';

const router = Router();

/**
 * GET /api/membership/tiers
 * Get all available membership tiers
 */
router.get('/tiers', async (req: AuthRequest, res: Response) => {
  try {
    const tiers = await membershipService.getMembershipTiers();
    res.json({ success: true, data: tiers });
  } catch (error) {
    console.error('Error fetching membership tiers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch membership tiers' });
  }
});

/**
 * GET /api/membership/status
 * Get current user's membership status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const membership = await membershipService.getUserMembershipStatus(userId);
    res.json({ success: true, data: membership });
  } catch (error) {
    console.error('Error fetching membership status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch membership status' });
  }
});

/**
 * GET /api/membership/history
 * Get user's membership history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const history = await membershipService.getUserMembershipHistory(userId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching membership history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch membership history' });
  }
});

/**
 * GET /api/membership/purchases
 * Get user's purchased content
 */
router.get('/purchases', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const purchases = await membershipService.getUserPurchases(userId);
    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchases' });
  }
});

/**
 * POST /api/membership/upgrade
 * Upgrade membership tier
 */
router.post('/upgrade', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { tierId, paymentProvider, subscriptionId } = req.body;
    
    if (!tierId) {
      return res.status(400).json({ success: false, error: 'Tier ID is required' });
    }

    const membership = await membershipService.upgradeMembership(
      userId,
      tierId,
      paymentProvider,
      subscriptionId
    );
    
    res.json({ success: true, data: membership });
  } catch (error) {
    console.error('Error upgrading membership:', error);
    res.status(500).json({ success: false, error: 'Failed to upgrade membership' });
  }
});

/**
 * POST /api/membership/cancel
 * Cancel membership
 */
router.post('/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await membershipService.cancelMembership(userId);
    res.json({ success: true, message: 'Membership cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling membership:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel membership' });
  }
});

/**
 * GET /api/membership/limits/:type
 * Check plan limits
 */
router.get('/limits/:type', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const type = req.params.type as string;
    const validTypes = ['instagram_accounts', 'dm_per_day', 'workflows', 'team_members'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid limit type' });
    }

    const limits = await membershipService.checkPlanLimits(
      userId,
      type as 'instagram_accounts' | 'dm_per_day' | 'workflows' | 'team_members'
    );
    
    res.json({ success: true, data: limits });
  } catch (error) {
    console.error('Error checking plan limits:', error);
    res.status(500).json({ success: false, error: 'Failed to check plan limits' });
  }
});

export default router;
