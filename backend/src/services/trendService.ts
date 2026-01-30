// Trend Service
// Phase B: AI Decision Engine - Trend Analysis

import { query } from '../config/database';
import { TrendData } from '../types/aiDecision';

/**
 * Trend Service
 * Analyzes trends for AI decision making
 */
class TrendService {
  async getCurrentTrends(userId: string): Promise<TrendData | null> {
    try {
      // 1. Get trending actions
      const trendingActionsResult = await query(
        `
        SELECT
          action_type,
          COUNT(*) as count
        FROM user_behavior_patterns
        WHERE user_id = $1
          AND last_performed_at > NOW() - INTERVAL '7 days'
        GROUP BY action_type
        ORDER BY count DESC
        LIMIT 5
        `,
        [userId]
      );

      const trendingActions = trendingActionsResult.rows.map(row => row.action_type);

      // 2. Get popular workflows
      const popularWorkflowsResult = await query(
        `
        SELECT
          aw.id,
          aw.name,
          COUNT(eh.id) as executions,
          AVG(CASE WHEN eh.execution_status = 'completed' THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM automation_workflows aw
        LEFT JOIN execution_history eh ON aw.id = eh.workflow_id
          AND eh.start_time > NOW() - INTERVAL '30 days'
        WHERE aw.user_id = $1
          OR aw.user_id IN (
            SELECT DISTINCT user_id
            FROM automation_workflows
            WHERE user_id = $1
            LIMIT 10
          )
        GROUP BY aw.id, aw.name
        ORDER BY executions DESC, "successRate" DESC
        LIMIT 10
        `,
        [userId]
      );

      const popularWorkflows = popularWorkflowsResult.rows.map(row => row.id);

      // 3. Get successful patterns
      const successfulPatternsResult = await query(
        `
        SELECT
          aw.name,
          aw.trigger_type,
          COUNT(eh.id) as executions,
          AVG(CASE WHEN eh.execution_status = 'completed' THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM automation_workflows aw
        JOIN execution_history eh ON aw.id = eh.workflow_id
        WHERE eh.user_id = $1
          AND eh.execution_status = 'completed'
          AND eh.start_time > NOW() - INTERVAL '7 days'
        GROUP BY aw.id, aw.name, aw.trigger_type
        ORDER BY "successRate" DESC
        LIMIT 5
        `,
        [userId]
      );

      const successfulPatterns = successfulPatternsResult.rows.map(row => `${row.name} (${row.trigger_type})`);

      return {
        trendingActions,
        popularWorkflows,
        successfulPatterns,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching trends:', error);
      return null;
    }
  }

  async getWorkflowTrends(workflowId: string, days: number = 30): Promise<any> {
    try {
      const result = await query(
        `
        SELECT
          DATE(start_time) as date,
          COUNT(*) as executions,
          SUM(CASE WHEN execution_status = 'completed' THEN 1 ELSE 0 END) as successes,
          SUM(CASE WHEN execution_status = 'failed' THEN 1 ELSE 0 END) as failures,
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as "avgDuration"
        FROM execution_history
        WHERE workflow_id = $1
          AND start_time > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(start_time)
        ORDER BY date ASC
        `,
        [workflowId]
      );

      return result.rows.map(row => ({
        date: row.date,
        executions: parseInt(row.executions),
        successes: parseInt(row.successes),
        failures: parseInt(row.failures),
        successRate: row.executions > 0 ? parseInt(row.successes) / parseInt(row.executions) : 0,
        avgDuration: parseFloat(row.avgDuration) || 0,
      }));
    } catch (error) {
      console.error('Error fetching workflow trends:', error);
      return [];
    }
  }

  async getEngagementTrends(userId: string, days: number = 30): Promise<any> {
    try {
      const result = await query(
        `
        SELECT
          DATE(start_time) as date,
          AVG(CASE
            WHEN (variables->>'engagement')::numeric IS NOT NULL
            THEN (variables->>'engagement')::numeric
            ELSE NULL
          END) as "avgEngagement"
        FROM execution_history
        WHERE user_id = $1
          AND start_time > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(start_time)
        ORDER BY date ASC
        `,
        [userId]
      );

      return result.rows.map(row => ({
        date: row.date,
        avgEngagement: parseFloat(row.avgEngagement) || 0,
      }));
    } catch (error) {
      console.error('Error fetching engagement trends:', error);
      return [];
    }
  }
}

export default new TrendService();
