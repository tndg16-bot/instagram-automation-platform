// User Behavior Service
// Phase B: AI Decision Engine - User Behavior Pattern Analysis

import { query } from '../config/database';
import {
  UserBehaviorPattern,
} from '../types/aiDecision';

/**
 * User Behavior Service
 * Analyzes user behavior patterns for AI decision making
 */
class UserBehaviorService {
  async getPatterns(userId: string): Promise<UserBehaviorPattern> {
    try {
      // 1. Get action type frequencies
      const actionTypesResult = await query(
        `
        SELECT
          action_type,
          COUNT(*) as frequency,
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as "avgExecutionTime",
          AVG(CASE WHEN execution_status = 'completed' THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM user_behavior_patterns
        WHERE user_id = $1
        GROUP BY action_type
        ORDER BY frequency DESC
        `,
        [userId]
      );

      const actionTypes = actionTypesResult.rows.map(row => row.action_type);
      const preferredActionTypes = actionTypes.slice(0, 3);

      // 2. Calculate average response rate
      const responseRateResult = await query(
        `
        SELECT
          AVG(CASE
            WHEN action_type IN ('send_dm', 'reply_comment')
            AND execution_status = 'completed'
            THEN 1.0
            ELSE 0.0
          END) as "averageResponseRate"
        FROM execution_history
        WHERE user_id = $1
          AND start_time > NOW() - INTERVAL '30 days'
        `,
        [userId]
      );

      const averageResponseRate = parseFloat(responseRateResult.rows[0]?.averageResponseRate || 0.3);

      // 3. Build action success rates
      const actionSuccessRates: Record<string, number> = {};
      for (const row of actionTypesResult.rows) {
        actionSuccessRates[row.action_type] = parseFloat(row.successRate) || 1.0;
      }

      // 4. Get preferred time of day
      const timeResult = await query(
        `
        SELECT
          time_of_day,
          COUNT(*) as count
        FROM user_behavior_patterns
        WHERE user_id = $1
        GROUP BY time_of_day
        ORDER BY count DESC
        LIMIT 1
        `,
        [userId]
      );

      const preferredTimeOfDay = parseInt(timeResult.rows[0]?.time_of_day || 12);

      // 5. Get preferred day of week
      const dayResult = await query(
        `
        SELECT
          day_of_week,
          COUNT(*) as count
        FROM user_behavior_patterns
        WHERE user_id = $1
        GROUP BY day_of_week
        ORDER BY count DESC
        LIMIT 1
        `,
        [userId]
      );

      const preferredDayOfWeek = parseInt(dayResult.rows[0]?.day_of_week || 1);

      return {
        userId,
        actionTypes,
        averageResponseRate,
        preferredActionTypes,
        actionSuccessRates,
        preferredTimeOfDay,
        preferredDayOfWeek,
        lastAnalyzed: new Date(),
      };
    } catch (error) {
      console.error('Error fetching user behavior patterns:', error);
      return {
        userId,
        actionTypes: [],
        averageResponseRate: 0.3,
        preferredActionTypes: ['send_dm'],
        actionSuccessRates: {},
        preferredTimeOfDay: 12,
        preferredDayOfWeek: 1,
        lastAnalyzed: new Date(),
      };
    }
  }

  async recordBehavior(
    userId: string,
    actionType: string,
    success: boolean,
    executionTime?: number
  ): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    try {
      // Check if entry exists
      const existing = await query(
        `
        SELECT id, frequency, success_rate
        FROM user_behavior_patterns
        WHERE user_id = $1
          AND action_type = $2
          AND time_of_day = $3
          AND day_of_week = $4
        `,
        [userId, actionType, hour, dayOfWeek]
      );

      if (existing.rows.length > 0) {
        // Update existing entry
        const row = existing.rows[0];
        const newFrequency = row.frequency + 1;
        const currentSuccessRate = parseFloat(row.success_rate) || 1.0;
        const newSuccessRate = (currentSuccessRate * (newFrequency - 1) + (success ? 1 : 0)) / newFrequency;

        await query(
          `
          UPDATE user_behavior_patterns
          SET
            frequency = $1,
            success_rate = $2,
            avg_response_time = COALESCE($3, avg_response_time),
            last_performed_at = NOW(),
            updated_at = NOW()
          WHERE id = $4
          `,
          [newFrequency, newSuccessRate, executionTime, row.id]
        );
      } else {
        // Insert new entry
        await query(
          `
          INSERT INTO user_behavior_patterns (
            user_id,
            action_type,
            frequency,
            time_of_day,
            day_of_week,
            success_rate,
            avg_response_time,
            last_performed_at,
            created_at,
            updated_at
          )
          VALUES ($1, $2, 1, $3, $4, $5, $6, NOW(), NOW())
          `,
          [userId, actionType, hour, dayOfWeek, success ? 1.0 : 0.0, executionTime]
        );
      }
    } catch (error) {
      console.error('Error recording user behavior:', error);
    }
  }

  async analyzeTrends(userId: string, days: number = 7): Promise<any> {
    try {
      const result = await query(
        `
        SELECT
          DATE(start_time) as date,
          action_type,
          COUNT(*) as count,
          AVG(CASE WHEN execution_status = 'completed' THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM execution_history
        WHERE user_id = $1
          AND start_time > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(start_time), action_type
        ORDER BY date DESC, count DESC
        `,
        [userId]
      );

      return result.rows.map(row => ({
        date: row.date,
        actionType: row.action_type,
        count: parseInt(row.count),
        successRate: parseFloat(row.successRate) || 0,
      }));
    } catch (error) {
      console.error('Error analyzing behavior trends:', error);
      return [];
    }
  }
}

export default new UserBehaviorService();
