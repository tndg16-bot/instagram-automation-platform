import { query } from '../../config/database';

class UserBehaviorTracker {
  async trackEvent(userId: string, eventType: string, eventData: any): Promise<void> {
    try {
      const { page_url, page_title, element_id, element_type, device_info, location_info } = eventData;

      await query(
        \`INSERT INTO user_behavior_analytics (user_id, session_id, event_type, page_url, page_title, element_id, element_type, metadata, device_info, location_info, timestamp, created_at)
         VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *\`,
        [userId, eventData.session_id || null, eventType, page_url || null, page_title || null, element_id || null, element_type || null, JSON.stringify(eventData), JSON.stringify(device_info || {}), JSON.stringify(location_info || {})]
      );
    } catch (error: any) {
      console.error('Error tracking user behavior:', error);
      throw error;
    }
  }

  async getAnalytics(userId: string, startDate: Date, endDate: Date, eventTypes?: string[]): Promise<any> {
    try {
      let whereClause = 'WHERE user_id = \$1 AND timestamp >= \$2 AND timestamp <= \$3';
      const params: any[] = [userId, startDate, endDate];
      let paramIndex = 4;

      if (eventTypes && eventTypes.length > 0) {
        whereClause += \` AND event_type = ANY(\$\${paramIndex++})\`;
        params.push(eventTypes);
      }

      const result = await query(
        \`SELECT 
           COUNT(*) as total_events,
           COUNT(DISTINCT session_id) as unique_sessions,
           AVG(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as page_views,
           COUNT(*) FILTER (WHERE event_type = 'click') as clicks,
           COUNT(*) FILTER (WHERE event_type = 'scroll') as scrolls,
           COUNT(*) FILTER (WHERE event_type = 'form_submit') as form_submits
       FROM user_behavior_analytics \${whereClause}\`,
        params
      );

      const data = result.rows[0];

      return {
        total_events: data.total_events,
        unique_sessions: data.unique_sessions,
        page_views: data.page_views,
        clicks: data.clicks,
        scrolls: data.scrolls,
        form_submits: data.form_submits,
        avg_session_duration: 0,
      };
    } catch (error: any) {
      console.error('Error getting user behavior analytics:', error);
      throw error;
    }
  }
}

export default new UserBehaviorTracker();
