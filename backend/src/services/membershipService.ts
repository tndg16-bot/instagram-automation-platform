import { query } from '../config/database';

export interface MembershipTier {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  features: any[];
  max_instagram_accounts: number;
  max_dm_per_day: number;
  max_workflows: number;
  max_team_members: number;
  ai_credits_per_month: number;
  priority_support: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserMembership {
  id: string;
  user_id: string;
  tier_id: number;
  tier?: MembershipTier;
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  payment_provider?: string;
  payment_subscription_id?: string;
  started_at: Date;
  expires_at?: Date;
  cancelled_at?: Date;
  auto_renew: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PurchasedContent {
  id: string;
  user_id: string;
  content_type: 'ebook' | 'video' | 'course' | 'template';
  content_id: string;
  title: string;
  description?: string;
  download_url?: string;
  thumbnail_url?: string;
  purchase_price: number;
  currency: string;
  purchased_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

/**
 * Get all available membership tiers
 */
export const getMembershipTiers = async (): Promise<MembershipTier[]> => {
  const result = await query(
    'SELECT * FROM membership_tiers ORDER BY price_monthly ASC'
  );
  return result.rows.map((row: MembershipTier) => ({
    ...row,
    features: Array.isArray(row.features) ? row.features : JSON.parse(row.features || '[]')
  }));
};

/**
 * Get membership tier by ID
 */
export const getMembershipTierById = async (id: number): Promise<MembershipTier | null> => {
  const result = await query(
    'SELECT * FROM membership_tiers WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    ...row,
    features: Array.isArray(row.features) ? row.features : JSON.parse(row.features || '[]')
  };
};

/**
 * Get user's current membership status
 */
export const getUserMembershipStatus = async (userId: string): Promise<UserMembership | null> => {
  const result = await query(
    `SELECT um.*, mt.* 
     FROM user_memberships um
     JOIN membership_tiers mt ON um.tier_id = mt.id
     WHERE um.user_id = $1 
     AND um.status = 'active'
     AND (um.expires_at IS NULL OR um.expires_at > NOW())
     ORDER BY um.created_at DESC
     LIMIT 1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    // Return Free tier as default
    const freeTier = await getMembershipTierById(1);
    if (freeTier) {
      return {
        id: 'free',
        user_id: userId,
        tier_id: freeTier.id,
        tier: freeTier,
        status: 'active',
        auto_renew: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as UserMembership;
    }
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    user_id: row.user_id,
    tier_id: row.tier_id,
    tier: {
      id: row.tier_id,
      name: row.name,
      display_name: row.display_name,
      description: row.description,
      price_monthly: row.price_monthly,
      price_yearly: row.price_yearly,
      features: Array.isArray(row.features) ? row.features : JSON.parse(row.features || '[]'),
      max_instagram_accounts: row.max_instagram_accounts,
      max_dm_per_day: row.max_dm_per_day,
      max_workflows: row.max_workflows,
      max_team_members: row.max_team_members,
      ai_credits_per_month: row.ai_credits_per_month,
      priority_support: row.priority_support,
      created_at: row.tier_created_at,
      updated_at: row.tier_updated_at,
    },
    status: row.status,
    payment_provider: row.payment_provider,
    payment_subscription_id: row.payment_subscription_id,
    started_at: row.started_at,
    expires_at: row.expires_at,
    cancelled_at: row.cancelled_at,
    auto_renew: row.auto_renew,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

/**
 * Get user's membership history
 */
export const getUserMembershipHistory = async (userId: string): Promise<UserMembership[]> => {
  const result = await query(
    `SELECT um.*, mt.name as tier_name, mt.display_name as tier_display_name
     FROM user_memberships um
     JOIN membership_tiers mt ON um.tier_id = mt.id
     WHERE um.user_id = $1
     ORDER BY um.created_at DESC`,
    [userId]
  );
  
  return result.rows.map((row: UserMembership & { tier_name: string; tier_display_name: string }) => ({
    ...row,
    tier: {
      name: row.tier_name,
      display_name: row.tier_display_name,
    }
  }));
};

/**
 * Upgrade or change user's membership tier
 */
export const upgradeMembership = async (
  userId: string,
  tierId: number,
  paymentProvider?: string,
  subscriptionId?: string
): Promise<UserMembership> => {
  // Cancel current active membership if exists
  await query(
    `UPDATE user_memberships 
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
  
  // Create new membership
  const result = await query(
    `INSERT INTO user_memberships 
     (user_id, tier_id, status, payment_provider, payment_subscription_id, started_at, auto_renew)
     VALUES ($1, $2, 'active', $3, $4, NOW(), $5)
     RETURNING *`,
    [userId, tierId, paymentProvider || null, subscriptionId || null, true]
  );
  
  return result.rows[0];
};

/**
 * Cancel user's membership
 */
export const cancelMembership = async (userId: string): Promise<void> => {
  await query(
    `UPDATE user_memberships 
     SET status = 'cancelled', cancelled_at = NOW(), auto_renew = FALSE
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
};

/**
 * Check if user has access to specific feature
 */
export const hasFeatureAccess = async (
  userId: string,
  feature: string
): Promise<boolean> => {
  const membership = await getUserMembershipStatus(userId);
  if (!membership || !membership.tier) return false;
  
  const features = membership.tier.features || [];
  return features.includes(feature) || membership.tier.name !== 'Free';
};

/**
 * Check if user is within their plan limits
 */
export const checkPlanLimits = async (
  userId: string,
  limitType: 'instagram_accounts' | 'dm_per_day' | 'workflows' | 'team_members'
): Promise<{ current: number; limit: number; withinLimit: boolean }> => {
  const membership = await getUserMembershipStatus(userId);
  if (!membership || !membership.tier) {
    return { current: 0, limit: 0, withinLimit: false };
  }
  
  let limit = 0;
  let currentQuery = '';
  
  switch (limitType) {
    case 'instagram_accounts':
      limit = membership.tier.max_instagram_accounts;
      currentQuery = 'SELECT COUNT(*) as count FROM instagram_accounts WHERE user_id = $1';
      break;
    case 'dm_per_day':
      limit = membership.tier.max_dm_per_day;
      currentQuery = `SELECT COUNT(*) as count FROM dm_campaigns 
                      WHERE user_id = $1 
                      AND created_at >= CURRENT_DATE 
                      AND status IN ('sending', 'completed')`;
      break;
    case 'workflows':
      limit = membership.tier.max_workflows;
      currentQuery = 'SELECT COUNT(*) as count FROM workflows WHERE user_id = $1 AND is_active = TRUE';
      break;
    default:
      return { current: 0, limit: 0, withinLimit: false };
  }
  
  const result = await query(currentQuery, [userId]);
  const current = parseInt(result.rows[0].count);
  
  return {
    current,
    limit,
    withinLimit: current < limit
  };
};

/**
 * Get user's purchased content
 */
export const getUserPurchases = async (userId: string): Promise<PurchasedContent[]> => {
  const result = await query(
    `SELECT * FROM purchased_content 
     WHERE user_id = $1 
     AND is_active = TRUE
     AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY purchased_at DESC`,
    [userId]
  );
  
  return result.rows;
};

/**
 * Add purchased content for user
 */
export const addPurchasedContent = async (
  userId: string,
  content: Omit<PurchasedContent, 'id' | 'user_id' | 'purchased_at' | 'is_active'>
): Promise<PurchasedContent> => {
  const result = await query(
    `INSERT INTO purchased_content 
     (user_id, content_type, content_id, title, description, download_url, 
      thumbnail_url, purchase_price, currency, expires_at, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
     ON CONFLICT (user_id, content_id) DO UPDATE SET
     is_active = TRUE, purchase_price = $8, purchased_at = NOW()
     RETURNING *`,
    [userId, content.content_type, content.content_id, content.title, 
     content.description, content.download_url, content.thumbnail_url,
     content.purchase_price, content.currency, content.expires_at]
  );
  
  return result.rows[0];
};

/**
 * Get membership statistics for admin
 */
export const getMembershipStats = async (): Promise<{
  totalMembers: number;
  activeMembers: number;
  tierDistribution: Record<string, number>;
  revenueThisMonth: number;
}> => {
  const totalResult = await query('SELECT COUNT(DISTINCT user_id) as count FROM user_memberships');
  const activeResult = await query(
    `SELECT COUNT(DISTINCT user_id) as count FROM user_memberships 
     WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`
  );
  
  const tierResult = await query(
    `SELECT mt.name, COUNT(um.id) as count
     FROM user_memberships um
     JOIN membership_tiers mt ON um.tier_id = mt.id
     WHERE um.status = 'active'
     GROUP BY mt.name`
  );
  
  const revenueResult = await query(
    `SELECT COALESCE(SUM(
       CASE 
         WHEN payment_subscription_id IS NOT NULL THEN 
           CASE WHEN expires_at IS NULL THEN mt.price_monthly ELSE mt.price_yearly / 12 END
         ELSE 0 
       END
     ), 0) as revenue
     FROM user_memberships um
     JOIN membership_tiers mt ON um.tier_id = mt.id
     WHERE um.status = 'active'
     AND um.created_at >= DATE_TRUNC('month', NOW())`
  );
  
  const tierDistribution: Record<string, number> = {};
  tierResult.rows.forEach((row: { name: string; count: string }) => {
    tierDistribution[row.name] = parseInt(row.count);
  });
  
  return {
    totalMembers: parseInt(totalResult.rows[0].count),
    activeMembers: parseInt(activeResult.rows[0].count),
    tierDistribution,
    revenueThisMonth: parseFloat(revenueResult.rows[0].revenue),
  };
};
