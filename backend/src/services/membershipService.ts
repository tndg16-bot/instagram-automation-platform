import { query } from '../config/database';
import dmCampaignService from './dmCampaignService';

/**
 * Service for managing user memberships and tier upgrades
 */
class MembershipService {
  async getMembershipStatus(userId: string): Promise<any> {
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
      return {
        tier: 'free',
        tier_name: 'Free',
        tier_features: [],
        tier_price: 0,
        status: 'active',
        start_date: null,
        end_date: null,
      };
    }

    const membership = result.rows[0];
    const isExpired = membership.end_date && new Date(membership.end_date) < new Date();
    const status = isExpired ? 'expired' : membership.status;

    return {
      tier: membership.tier_id,
      tier_name: membership.tier_name,
      tier_features: JSON.parse(membership.tier_features || '[]'),
      tier_price: parseFloat(membership.tier_price),
      status,
      start_date: membership.start_date,
      end_date: membership.end_date,
      auto_renew: membership.auto_renew,
    };
  }

  async getPurchases(userId: string): Promise<any[]> {
    const result = await query(
      `SELECT p.*, c.title, c.description, c.file_url, c.thumbnail_url
       FROM purchases p
       LEFT JOIN content c ON p.content_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.purchased_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async upgradeMembership(userId: string, tierId: string): Promise<any> {
    const tierResult = await query(
      'SELECT * FROM membership_tiers WHERE id = $1',
      [tierId]
    );

    if (tierResult.rows.length === 0) {
      throw new Error('Tier not found');
    }

    const tier = tierResult.rows[0];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + tier.duration_days * 24 * 60 * 60 * 1000);

    const result = await query(
      `INSERT INTO user_memberships (user_id, tier_id, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (user_id)
       DO UPDATE SET tier_id = $2, start_date = $3, end_date = $4, status = 'active', updated_at = NOW()
       RETURNING *`,
      [userId, tierId, startDate, endDate]
    );

    return result.rows[0];
  }

  async listTiers(): Promise<any[]> {
    const result = await query(
      'SELECT * FROM membership_tiers ORDER BY price ASC'
    );

    return result.rows.map((tier: any) => ({
      ...tier,
      features: JSON.parse(tier.features || '[]'),
    }));
  }

  async checkMembershipExpiration(userId: string): Promise<any> {
    const result = await query(
      `SELECT um.*, mt.duration_days
       FROM user_memberships um
       JOIN membership_tiers mt ON um.tier_id = mt.id
       WHERE um.user_id = $1 AND um.status = 'active'
       ORDER BY um.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { expires_soon: false, expired: false };
    }

    const membership = result.rows[0];
    const now = new Date();
    const endDate = new Date(membership.end_date);
    
    const expired = endDate < now;
    const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      expires_soon: daysUntilExpiration <= 7 && !expired,
      expired,
      days_until_expiration: Math.max(0, daysUntilExpiration),
      end_date: membership.end_date,
    };
  }
}

export default new MembershipService();
