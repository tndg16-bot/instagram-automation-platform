import pool from '../config/database';

interface UserEngagementMetrics {
  total_followers: number;
  total_following: number;
  total_posts: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  total_dms_sent: number;
  total_dms_delivered: number;
  dm_delivery_rate: number;
  total_comments_received: number;
  total_comments_replied: number;
  comment_reply_rate: number;
  weekly_followers_growth: number;
  weekly_posts_count: number;
  weekly_dms_sent: number;
}

class AnalyticsService {
  /**
   * Get overall user engagement metrics
   */
  async getUserEngagementMetrics(userId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<UserEngagementMetrics> {
    const whereClause = period === '7d'
      ? 'AND i.created_at >= NOW() - INTERVAL \'7 days\''
      : period === '30d'
        ? 'AND i.created_at >= NOW() - INTERVAL \'30 days\''
        : 'AND i.created_at >= NOW() - INTERVAL \'90 days\'';

    const query = `
      SELECT
        COALESCE(i.followers_count, 0) as total_followers,
        COALESCE(i.following_count, 0) as total_following,
        COALESCE(i.posts_count, 0) as total_posts,
        COALESCE(AVG(ps.likes_count), 0) as avg_likes_per_post,
        COALESCE(AVG(ps.comments_count), 0) as avg_comments_per_post,
        COALESCE(COUNT(DISTINCT dmcr.id), 0) as total_dms_sent,
        COALESCE(SUM(CASE WHEN dmcr.status = 'delivered' THEN 1 ELSE 0 END), 0) as total_dms_delivered,
        COALESCE(
          CASE
            WHEN COUNT(DISTINCT dmcr.id) > 0 THEN
              (SUM(CASE WHEN dmcr.status = 'delivered' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT dmcr.id))
            ELSE 0
          END,
          0
        ) as dm_delivery_rate,
        COALESCE(COUNT(ic.id), 0) as total_comments_received,
        COALESCE(COUNT(CASE WHEN ic.status = 'replied' THEN 1 END), 0) as total_comments_replied,
        COALESCE(
          CASE
            WHEN COUNT(ic.id) > 0 THEN
              (COUNT(CASE WHEN ic.status = 'replied' THEN 1 END) * 100.0 / COUNT(ic.id))
            ELSE 0
          END,
          0
        ) as comment_reply_rate,
        COALESCE(
          (i.followers_count - LAG(i.followers_count, 1) OVER (ORDER BY i.created_at)) / NULLIF(
            LAG(i.followers_count, 1) OVER (ORDER BY i.created_at),
            0
          ),
          0
        ) as weekly_followers_growth,
        COALESCE(COUNT(sp.id) FILTER (WHERE sp.created_at >= NOW() - INTERVAL '7 days'), 0) as weekly_posts_count,
        COALESCE(COUNT(DISTINCT dmcr.id) FILTER (WHERE dmcr.created_at >= NOW() - INTERVAL '7 days'), 0) as weekly_dms_sent
      FROM instagram_accounts i
      LEFT JOIN scheduled_posts sp ON i.user_id = sp.user_id AND sp.status = 'published' AND sp.created_at >= NOW() - INTERVAL '90 days'
      LEFT JOIN dm_campaign_recipients dmcr ON i.user_id = dmcr.user_id AND dmcr.sent_at >= NOW() - INTERVAL '90 days'
      LEFT JOIN instagram_comments ic ON i.user_id = ic.user_id AND ic.timestamp >= NOW() - INTERVAL '90 days'
      WHERE i.user_id = $1 ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT 1;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || this.getEmptyMetrics();
  }

  /**
   * Get content performance metrics
   */
  async getContentPerformance(userId: string, limit: number = 20): Promise<any[]> {
    const query = `
      SELECT
        sp.id,
        sp.media_type,
        sp.caption,
        sp.published_at,
        sp.status,
        COALESCE(sp_permalink.permalink, 'N/A') as permalink,
        ps.likes_count,
        ps.comments_count,
        ps.shares_count,
        CASE
          WHEN ps.likes_count + ps.comments_count > 0 THEN
            (ps.likes_count + ps.comments_count) / 100.0
          ELSE 0
        END as engagement_rate
      FROM scheduled_posts sp
      LEFT JOIN instagram_posts ps ON sp.instagram_media_id = ps.id
      LEFT JOIN LATERAL (
        SELECT id, permalink
        FROM instagram_posts
        WHERE id = (SELECT id FROM instagram_posts ORDER BY created_at DESC LIMIT 1)
      ) sp_permalink ON sp.instagram_media_id = sp_permalink.id
      WHERE sp.user_id = $1
        AND sp.status = 'published'
      ORDER BY sp.published_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get DM campaign performance
   */
  async getDMCampaignPerformance(userId: string, limit: number = 20): Promise<any[]> {
    const query = `
      SELECT
        dc.id,
        dc.name,
        dc.campaign_type,
        dc.status,
        dc.created_at,
        dc.started_at,
        dc.completed_at,
        dc.total_recipients,
        dc.sent_count,
        dc.delivered_count,
        dc.read_count,
        CASE
          WHEN dc.sent_count > 0 THEN
            (dc.delivered_count * 100.0 / dc.sent_count)
          ELSE 0
        END as delivery_rate,
        CASE
          WHEN dc.delivered_count > 0 THEN
            (dc.read_count * 100.0 / dc.delivered_count)
          ELSE 0
        END as open_rate
      FROM dm_campaigns dc
      WHERE dc.user_id = $1
      ORDER BY dc.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get growth metrics over time
   */
  async getGrowthMetrics(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<any[]> {
    const intervalClause = period === 'daily'
      ? 'DATE_TRUNC(\'day\', i.created_at)'
      : period === 'weekly'
        ? 'DATE_TRUNC(\'week\', i.created_at)'
        : 'DATE_TRUNC(\'month\', i.created_at)';

    const query = `
      SELECT
        ${intervalClause} as period,
        MAX(i.followers_count) as followers_count,
        MAX(i.following_count) as following_count,
        COUNT(DISTINCT sp.id) as posts_count,
        COUNT(DISTINCT dmcr.id) as dms_sent
      FROM instagram_accounts i
      LEFT JOIN scheduled_posts sp ON i.user_id = sp.user_id AND sp.status = 'published'
      LEFT JOIN dm_campaign_recipients dmcr ON i.user_id = dmcr.user_id AND dmcr.sent_at IS NOT NULL
      WHERE i.user_id = $1
        AND i.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY ${intervalClause}
      ORDER BY period DESC
      LIMIT 12;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get audience demographics
   */
  async getAudienceDemographics(userId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(DISTINCT dmr.recipient_id) as total_audience,
        COUNT(DISTINCT dmr.recipient_id) FILTER (WHERE dmr.sent_at >= NOW() - INTERVAL '30 days')) as recent_audience,
        COUNT(DISTINCT dmr.recipient_id) FILTER (WHERE dmr.status = 'delivered' AND dmr.sent_at >= NOW() - INTERVAL '30 days')) as active_audience
      FROM dm_campaign_recipients dmr
      JOIN dm_campaigns dc ON dmr.campaign_id = dc.id
      WHERE dc.user_id = $1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || {
      total_audience: 0,
      recent_audience: 0,
      active_audience: 0,
    };
  }

  /**
   * Get top performing posts
   */
  async getTopPerformingPosts(userId: string, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT
        sp.id,
        sp.media_type,
        sp.caption,
        sp.published_at,
        sp.instagram_media_id,
        COALESCE(ps_permalink.permalink, 'N/A') as permalink,
        COALESCE(ps.likes_count, 0) as likes_count,
        COALESCE(ps.comments_count, 0) as comments_count,
        COALESCE(ps.shares_count, 0) as shares_count,
        COALESCE(ps.likes_count, 0) + COALESCE(ps.comments_count, 0) + COALESCE(ps.shares_count, 0) as total_engagement
      FROM scheduled_posts sp
      LEFT JOIN instagram_posts ps ON sp.instagram_media_id = ps.id
      LEFT JOIN LATERAL (
        SELECT id, permalink
        FROM instagram_posts
        WHERE id = (SELECT id FROM instagram_posts ORDER BY created_at DESC LIMIT 1)
      ) sp_permalink ON sp.instagram_media_id = sp_permalink.id
      WHERE sp.user_id = $1
        AND sp.status = 'published'
        AND sp.published_at >= NOW() - INTERVAL '90 days'
      ORDER BY total_engagement DESC
      LIMIT $1;
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get analytics dashboard summary
   */
  async getDashboardSummary(userId: string): Promise<any> {
    const query = `
      SELECT
        COUNT(DISTINCT sp.id) as total_posts,
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.published_at >= NOW() - INTERVAL '30 days')) as posts_last_30d,
        COUNT(DISTINCT dc.id) as total_campaigns,
        COUNT(DISTINCT dc.id) FILTER (WHERE dc.started_at >= NOW() - INTERVAL '30 days')) as campaigns_last_30d,
        COUNT(DISTINCT dmcr.id) as total_dms_sent,
        COUNT(DISTINCT dmcr.id) FILTER (WHERE dmcr.sent_at >= NOW() - INTERVAL '30 days')) as dms_last_30d,
        COUNT(DISTINCT ic.id) as total_comments,
        COUNT(DISTINCT ic.id) FILTER (WHERE ic.timestamp >= NOW() - INTERVAL '30 days')) as comments_last_30d,
        COALESCE(i.followers_count, 0) as current_followers,
        COALESCE(i.followers_count - LAG(i.followers_count, 1) OVER (ORDER BY i.created_at), 0) as followers_growth
      FROM instagram_accounts i
      LEFT JOIN scheduled_posts sp ON i.user_id = sp.user_id AND sp.status = 'published'
      LEFT JOIN dm_campaigns dc ON i.user_id = dc.user_id
      LEFT JOIN dm_campaign_recipients dmcr ON dc.id = dmcr.campaign_id
      LEFT JOIN instagram_comments ic ON i.user_id = ic.user_id
      WHERE i.user_id = $1
      ORDER BY i.created_at DESC
      LIMIT 1;
    `;

    const result = await pool.query(query, [userId]);
    const data = result.rows[0];

    return {
      posts: {
        total: data.total_posts || 0,
        last_30d: data.posts_last_30d || 0,
      },
      campaigns: {
        total: data.total_campaigns || 0,
        last_30d: data.campaigns_last_30d || 0,
      },
      dms: {
        total: data.total_dms_sent || 0,
        last_30d: data.dms_last_30d || 0,
      },
      comments: {
        total: data.total_comments || 0,
        last_30d: data.comments_last_30d || 0,
      },
      followers: {
        current: data.current_followers || 0,
        growth: data.followers_growth || 0,
      },
    };
  }

  private getEmptyMetrics(): UserEngagementMetrics {
    return {
      total_followers: 0,
      total_following: 0,
      total_posts: 0,
      avg_likes_per_post: 0,
      avg_comments_per_post: 0,
      total_dms_sent: 0,
      total_dms_delivered: 0,
      dm_delivery_rate: 0,
      total_comments_received: 0,
      total_comments_replied: 0,
      comment_reply_rate: 0,
      weekly_followers_growth: 0,
      weekly_posts_count: 0,
      weekly_dms_sent: 0,
    };
  }
}

export default AnalyticsService;
