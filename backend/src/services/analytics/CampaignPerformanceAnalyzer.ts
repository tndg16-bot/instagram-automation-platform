import { query } from '../../config/database';

class CampaignPerformanceAnalyzer {
  async trackMetric(campaignId: string, userId: string, metricType: string, metricValue: any, segmentTags?: string[], customSegment?: string): Promise<void> {
    try {
      await query(
        \`INSERT INTO campaign_performance_analytics (campaign_id, user_id, metrics_type, metric_value, metric_count, segment_tags, custom_segment, timestamp, created_at)
         VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *\`,
        [campaignId, userId, metricType, JSON.stringify(metricValue), 1, segmentTags, customSegment]
      );
    } catch (error: any) {
      console.error('Error tracking campaign metric:', error);
      throw error;
    }
  }

  async getCampaignPerformance(userId: string, campaignId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      let whereClause = 'WHERE user_id = \$1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (campaignId) {
        whereClause += \` AND campaign_id = \$\${paramIndex++}\`;
        params.push(campaignId);
      }

      if (startDate) {
        whereClause += \` AND timestamp >= \$\${paramIndex++}\`;
        params.push(startDate);
      }

      if (endDate) {
        whereClause += \` AND timestamp <= \$\${paramIndex++}\`;
        params.push(endDate);
      }

      const result = await query(
        \`SELECT 
           campaign_id,
           SUM(total_sent) as total_sent,
           SUM(total_opened) as total_opened,
           SUM(total_clicked) as total_clicked,
           SUM(total_bounced) as total_bounced,
           SUM(total_unsubscribed) as total_unsubscribed,
           AVG(total_opened * 100.0 / NULLIF(total_sent, 0)) as avg_open_rate,
           AVG(total_clicked * 100.0 / NULLIF(total_sent, 0)) as avg_click_rate,
           AVG(total_bounced * 100.0 / NULLIF(total_sent, 0)) as avg_bounce_rate,
           COUNT(DISTINCT variant_id) as total_variants
       FROM newsletter_campaigns \${whereClause}\`,
        params
      );

      const data = result.rows[0];

      return {
        total_campaigns: data.total_campaigns,
        total_sent: data.total_sent,
        total_opened: data.total_opened,
        total_clicked: data.total_clicked,
        total_bounced: data.total_bounced,
        total_unsubscribed: data.total_unsubscribed,
        avg_open_rate: parseFloat(data.avg_open_rate).toFixed(2),
        avg_click_rate: parseFloat(data.avg_click_rate).toFixed(2),
        avg_bounce_rate: parseFloat(data.avg_bounce_rate).toFixed(2),
        total_variants: data.total_variants,
      };
    } catch (error: any) {
      console.error('Error getting campaign performance:', error);
      throw error;
    }
  }
}

export default new CampaignPerformanceAnalyzer();
