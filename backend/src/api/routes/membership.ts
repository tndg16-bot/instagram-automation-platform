import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

interface MembershipTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  duration_days: number;
  created_at: Date;
}

interface UserMembership {
  id: string;
  user_id: string;
  tier_id: string;
  start_date: Date;
  end_date: Date | null;
  auto_renew: boolean;
  status: 'active' | 'expired' | 'cancelled';
  created_at: Date;
}

interface Purchase {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'ebook' | 'video' | 'course';
  price: number;
  purchased_at: Date;
}

// GET /api/membership/status - Get user's membership status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT um.*, mt.name as tier_name, mt.features as tier_features, mt.price as tier_price
       FROM user_memberships um
       JOIN membership_tiers mt ON um.tier_id = mt.id
       WHERE um.user_id = $1
       ORDER BY um.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          tier: 'free',
          tier_name: 'Free',
          tier_features: [],
          tier_price: 0,
          status: 'active',
          start_date: null,
          end_date: null,
        },
      });
    }

    const membership = result.rows[0];

    // Check if membership is expired
    const isExpired = membership.end_date && new Date(membership.end_date) < new Date();
    const status = isExpired ? 'expired' : membership.status;

    res.json({
      success: true,
      data: {
        tier: membership.tier_id,
        tier_name: membership.tier_name,
        tier_features: JSON.parse(membership.tier_features || '[]'),
        tier_price: parseFloat(membership.tier_price),
        status,
        start_date: membership.start_date,
        end_date: membership.end_date,
        auto_renew: membership.auto_renew,
      },
    });
  } catch (error: any) {
    console.error('Error getting membership status:', error);
    res.status(500).json({ success: false, error: 'Failed to get membership status' });
  }
});

// GET /api/membership/purchases - Get user's purchased content
router.get('/purchases', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT p.*, c.title, c.description, c.file_url, c.thumbnail_url
       FROM purchases p
       LEFT JOIN content c ON p.content_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.purchased_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error getting purchases:', error);
    res.status(500).json({ success: false, error: 'Failed to get purchases' });
  }
});

// PUT /api/membership/tier - Update membership tier
router.put('/tier', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { tier_id } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!tier_id) {
      return res.status(400).json({ success: false, error: 'tier_id is required' });
    }

    // Get tier details
    const tierResult = await query(
      'SELECT * FROM membership_tiers WHERE id = $1',
      [tier_id]
    );

    if (tierResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tier not found' });
    }

    const tier = tierResult.rows[0];

    // Calculate end date based on tier duration
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + tier.duration_days * 24 * 60 * 60 * 1000);

    // Create or update membership
    const result = await query(
      `INSERT INTO user_memberships (user_id, tier_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (user_id)
       DO UPDATE SET tier_id = $2, start_date = $3, end_date = $4, status = 'active', updated_at = NOW()
       RETURNING *`,
      [userId, tier_id, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating membership tier:', error);
    res.status(500).json({ success: false, error: 'Failed to update membership tier' });
  }
});

// GET /api/membership/tiers - List all available tiers
router.get('/tiers', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM membership_tiers ORDER BY price ASC'
    );

    res.json({
      success: true,
      data: result.rows.map((tier: any) => ({
        ...tier,
        features: JSON.parse(tier.features || '[]'),
      })),
    });
  } catch (error: any) {
    console.error('Error getting tiers:', error);
    res.status(500).json({ success: false, error: 'Failed to get tiers' });
  }
});

export default router;
