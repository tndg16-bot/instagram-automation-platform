// Execution History Service
// Phase B: AI Decision Engine - Execution History Management

import { query } from '../config/database';
import {
  ExecutionHistoryItem,
} from '../types/aiDecision';

/**
 * Execution History Service
 * Manages workflow execution history for AI decision making
 */
class ExecutionHistoryService {
  async getExecutionHistory(workflowId: string, limit: number = 100): Promise<ExecutionHistoryItem[]> {
    try {
      const result = await query(
        `
        SELECT
          id,
          workflow_id as "workflowId",
          user_id as "userId",
          execution_status as "status",
          start_time as "startedAt",
          end_time as "completedAt",
          duration_seconds as "duration",
          trigger_data as "triggerData",
          variables,
          created_at as "createdAt"
        FROM execution_history
        WHERE workflow_id = $1
        ORDER BY start_time DESC
        LIMIT $2
        `,
        [workflowId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        workflowId: row.workflowId,
        userId: row.userId,
        status: row.status,
        startedAt: new Date(row.startedAt),
        completedAt: row.completedAt ? new Date(row.completedAt) : null,
        duration: row.duration,
        triggerData: row.triggerData,
        result: row.variables,
      }));
    } catch (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }
  }

  async getUserExecutionHistory(userId: string, limit: number = 50): Promise<ExecutionHistoryItem[]> {
    try {
      const result = await query(
        `
        SELECT
          id,
          workflow_id as "workflowId",
          user_id as "userId",
          execution_status as "status",
          start_time as "startedAt",
          end_time as "completedAt",
          duration_seconds as "duration",
          trigger_data as "triggerData",
          variables,
          created_at as "createdAt"
        FROM execution_history
        WHERE user_id = $1
        ORDER BY start_time DESC
        LIMIT $2
        `,
        [userId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        workflowId: row.workflowId,
        userId: row.userId,
        status: row.status,
        startedAt: new Date(row.startedAt),
        completedAt: row.completedAt ? new Date(row.completedAt) : null,
        duration: row.duration,
        triggerData: row.triggerData,
        result: row.variables,
      }));
    } catch (error) {
      console.error('Error fetching user execution history:', error);
      return [];
    }
  }

  async getWorkflowMetrics(workflowId: string): Promise<any> {
    try {
      const result = await query(
        `
        SELECT
          COUNT(*) as "totalRuns",
          SUM(CASE WHEN execution_status = 'completed' THEN 1 ELSE 0 END) as "successfulRuns",
          SUM(CASE WHEN execution_status = 'failed' THEN 1 ELSE 0 END) as "failedRuns",
          AVG(CASE WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) ELSE NULL END) as "avgExecutionTime",
          AVG(CASE WHEN execution_status = 'completed' THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM execution_history
        WHERE workflow_id = $1
        `,
        [workflowId]
      );

      const row = result.rows[0];
      return {
        totalRuns: parseInt(row.totalRuns),
        successRate: row.successRate || 0,
        averageExecutionTime: row.avgExecutionTime || 0,
        recentSuccessRate: row.successRate || 0,
        averageEngagement: 0.05, // Placeholder
        failureRate: row.failedRuns > 0 ? row.failedRuns / row.totalRuns : 0,
      };
    } catch (error) {
      console.error('Error fetching workflow metrics:', error);
      return null;
    }
  }

  async recordExecution(execution: Partial<ExecutionHistoryItem>): Promise<ExecutionHistoryItem | null> {
    try {
      const result = await query(
        `
        INSERT INTO execution_history (
          workflow_id,
          user_id,
          status,
          start_time,
          end_time,
          duration_seconds,
          trigger_data,
          variables,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
        `,
        [
          execution.workflowId,
          execution.userId,
          execution.status,
          execution.startedAt,
          execution.completedAt,
          execution.duration,
          JSON.stringify(execution.triggerData),
          JSON.stringify(execution.result),
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        workflowId: row.workflow_id,
        userId: row.user_id,
        status: row.execution_status,
        startedAt: new Date(row.start_time),
        completedAt: row.end_time ? new Date(row.end_time) : null,
        duration: row.duration_seconds,
        triggerData: row.trigger_data,
        result: row.variables,
      };
    } catch (error) {
      console.error('Error recording execution:', error);
      return null;
    }
  }
}

export default new ExecutionHistoryService();
