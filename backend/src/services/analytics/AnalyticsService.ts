import { UserBehaviorTracker } from './UserBehaviorTracker';
import { CampaignPerformanceAnalyzer } from './CampaignPerformanceAnalyzer';

class AnalyticsService {
  private userBehaviorTracker = new UserBehaviorTracker();
  private campaignPerformanceAnalyzer = new CampaignPerformanceAnalyzer();

  async trackUserBehavior(userId: string, eventType: string, eventData: any): Promise<void> {
    return await this.userBehaviorTracker.trackEvent(userId, eventType, eventData);
  }

  async getUserBehaviorAnalytics(userId: string, startDate: Date, endDate: Date, eventTypes?: string[]): Promise<any> {
    return await this.userBehaviorTracker.getAnalytics(userId, startDate, endDate, eventTypes);
  }

  async trackCampaignPerformance(campaignId: string, userId: string, metricType: string, metricValue: any, segmentTags?: string[], customSegment?: string): Promise<void> {
    return await this.campaignPerformanceAnalyzer.trackMetric(campaignId, userId, metricType, metricValue, segmentTags, customSegment);
  }

  async getCampaignPerformance(userId: string, campaignId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    return await this.campaignPerformanceAnalyzer.getCampaignPerformance(userId, campaignId, startDate, endDate);
  }

  async recordABTestResult(testId: string, userId: string, variantId: string, campaignId: string, metrics: any): Promise<void> {
    try {
      const { metrics, sample_size, statistical_significance, is_winner } = metrics;

      const result = await query(
        `INSERT INTO ab_test_results (test_id, variant_id, user_id, campaign_id, metrics, sample_size, statistical_significance, is_winner, timestamp, created_at)
         VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [testId, variantId, userId, campaignId, JSON.stringify(metrics), sample_size, statistical_significance, is_winner]
      );

      return result.rows[0];
    } catch (error: any) {
      console.error('Error recording A/B test result:', error);
      throw error;
    }
  }

  async aggregateAnalytics(userId: string, metricType: string, timeRange: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const result = await query(
        `SELECT * FROM analytics_aggregation_cache
         WHERE user_id = \$1 AND metric_type = \$2 AND time_range = \$3 AND start_date >= \$4 AND end_date <= \$5
         ORDER BY updated_at DESC
         LIMIT 1`,
        [userId, metricType, timeRange, startDate, endDate]
      );

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].aggregated_data);
      }

      const aggregatedData = await this.generateAggregation(userId, metricType, timeRange, startDate, endDate);
      return aggregatedData;
    } catch (error: any) {
      console.error('Error aggregating analytics:', error);
      throw error;
    }
  }

  async getRealtimeEvents(userId: string, eventType?: string, limit: number = 100, processed?: boolean): Promise<any> {
    try {
      let whereClause = 'WHERE user_id = \$1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (eventType) {
        whereClause += ` AND event_type = \$\${paramIndex++}`;
        params.push(eventType);
      }

      if (processed !== undefined) {
        whereClause += ` AND processed = \$\${paramIndex++}`;
        params.push(processed);
      }

      const result = await query(
        `SELECT * FROM realtime_analytics_events \${whereClause} ORDER BY timestamp DESC LIMIT \$\${paramIndex++}`,
        [...params, limit]
      );

      return {
        success: true,
        data: result.rows,
        count: result.rows.length,
      };
    } catch (error: any) {
      console.error('Error getting realtime events:', error);
      return {
        success: false,
        error: 'Failed to get realtime events',
      };
    }
  }

  async processRealtimeEvents(limit: number = 100): Promise<void> {
    try {
      const result = await query(
        `UPDATE realtime_analytics_events
         SET processed = true
         WHERE processed = false
         RETURNING *
         LIMIT \$1`,
        [limit]
      );

      console.log(`Processed \${result.rows.length} realtime events`);
    } catch (error: any) {
      console.error('Error processing realtime events:', error);
      throw error;
    }
  }

  async markEventAsProcessed(eventId: string): Promise<void> {
    try {
      await query(
        `UPDATE realtime_analytics_events
         SET processed = true
         WHERE id = \$1`,
        [eventId]
      );
    } catch (error: any) {
      console.error('Error marking event as processed:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
