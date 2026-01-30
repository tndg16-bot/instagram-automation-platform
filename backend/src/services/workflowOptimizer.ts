// Workflow Optimizer Service
// Phase E: Workflow Auto-Optimization

import { query } from '../config/database';
import {
  WorkflowOptimization,
  ProposedChange,
  WorkflowMetrics,
  NodeMetrics,
  Bottleneck,
  ABTestConfig,
  ABTestResult,
  CostOptimization,
  BottleneckDetection,
} from '../types/optimization';

/**
 * Workflow Optimizer Service
 * Automatically optimizes workflows for better performance and cost-efficiency
 */
class WorkflowOptimizer {
  async optimizeWorkflow(workflowId: string): Promise<WorkflowOptimization> {
    // 1. Load workflow and metrics
    const originalMetrics = await this.getWorkflowMetrics(workflowId);

    // 2. Detect bottlenecks
    const bottlenecks = await this.detectBottlenecks(workflowId, originalMetrics);

    // 3. Suggest A/B tests
    const abTests = await this.generateABTests(workflowId, originalMetrics);

    // 4. Optimize AI usage
    const aiOptimizations = await this.optimizeAINodes(workflowId, originalMetrics);

    // 5. Simplify logic
    const simplifications = await this.simplifyWorkflow(workflowId, originalMetrics);

    // 6. Aggregate all proposed changes
    const proposedChanges: ProposedChange[] = [];
    proposedChanges.push(...bottlenecks);
    proposedChanges.push(...abTests);
    proposedChanges.push(...aiOptimizations);
    proposedChanges.push(...simplifications);

    // 7. Calculate expected improvement
    const expectedImprovement = this.calculateExpectedImprovement(originalMetrics, proposedChanges);

    // 8. Calculate confidence
    const confidence = this.calculateConfidence(proposedChanges, originalMetrics);

    return {
      workflowId,
      originalMetrics,
      proposedChanges,
      expectedImprovement,
      confidence
    };
  }

  private async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    try {
      // Get node metrics
      const nodeResult = await query(
        `
        SELECT
          node_id,
          step_type as "nodeType",
          COUNT(*) as "executionCount",
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as "avgExecutionTime",
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as "failures",
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as "successes"
        FROM automation_workflow_steps aws
        JOIN automation_execution_logs ael ON aws.workflow_id = ael.workflow_id
        WHERE ael.workflow_id = $1
        GROUP BY node_id, step_type
        `,
        [workflowId]
      );

      const nodeMetrics: Record<string, NodeMetrics> = {};
      const bottlenecks: string[] = [];

      for (const row of nodeResult.rows) {
        const successRate = row.successes / row.executionCount;
        const errorRate = row.failures / row.executionCount;

        nodeMetrics[row.node_id] = {
          nodeId: row.node_id,
          avgExecutionTime: parseFloat(row.avgExecutionTime) || 0,
          successRate,
          errorRate,
          executionCount: parseInt(row.executionCount)
        };

        // Identify bottlenecks
        if (row.avgExecutionTime > 10000) { // > 10 seconds
          bottlenecks.push(row.node_id);
        }
        if (errorRate > 0.2) { // > 20% error rate
          bottlenecks.push(row.node_id);
        }
      }

      // Get overall workflow metrics
      const workflowResult = await query(
        `
        SELECT
          COUNT(*) as "totalRuns",
          SUM(CASE WHEN execution_status = 'completed' THEN 1 ELSE 0 END) as "successfulRuns",
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as "avgExecutionTime",
          AVG(CASE
            WHEN (variables->>'cost')::numeric IS NOT NULL
            THEN (variables->>'cost')::numeric
            ELSE 0
          END) as "avgCost"
        FROM execution_history
        WHERE workflow_id = $1
        `,
        [workflowId]
      );

      const row = workflowResult.rows[0];
      return {
        totalRuns: parseInt(row.totalRuns),
        successRate: row.successfulRuns / row.totalRuns,
        averageExecutionTime: parseFloat(row.avgExecutionTime) || 0,
        averageCost: parseFloat(row.avgCost) || 0,
        nodeMetrics,
        bottlenecks,
        failureRate: 1 - (row.successfulRuns / row.totalRuns)
      };
    } catch (error) {
      console.error('Error fetching workflow metrics:', error);
      return {
        totalRuns: 0,
        successRate: 0,
        averageExecutionTime: 0,
        averageCost: 0,
        nodeMetrics: {},
        bottlenecks: [],
        failureRate: 0
      };
    }
  }

  private async detectBottlenecks(workflowId: string, metrics: WorkflowMetrics): Promise<ProposedChange[]> {
    const changes: ProposedChange[] = [];

    for (const nodeId in metrics.nodeMetrics) {
      const nodeMetric = metrics.nodeMetrics[nodeId];

      // Slow nodes
      if (nodeMetric.avgExecutionTime > 5000) {
        changes.push({
          nodeId,
          changeType: 'modify',
          description: '実行時間が長いです。キャッシュを追加または最適化を検討してください',
          reason: `平均実行時間: ${(nodeMetric.avgExecutionTime / 1000).toFixed(1)}秒`,
          newConfig: { addCache: true },
          expectedImpact: {
            timeSaved: nodeMetric.avgExecutionTime - 2000, // Save 2 seconds
            costReduction: 0,
            successIncrease: 0.05
          }
        });
      }

      // High error rate
      if (nodeMetric.errorRate > 0.1) {
        changes.push({
          nodeId,
          changeType: 'modify',
          description: 'エラー率が高いです。リトライ戦略を見直してください',
          reason: `エラー率: ${(nodeMetric.errorRate * 100).toFixed(1)}%`,
          newConfig: { increaseRetries: true },
          expectedImpact: {
            timeSaved: 0,
            costReduction: 0,
            successIncrease: 0.1
          }
        });
      }
    }

    return changes;
  }

  private async generateABTests(workflowId: string, metrics: WorkflowMetrics): Promise<ProposedChange[]> {
    const changes: ProposedChange[] = [];

    try {
      // Get AI nodes in workflow
      const result = await query(
        `
        SELECT
          id as "nodeId",
          step_config
        FROM automation_workflow_steps
        WHERE workflow_id = $1
          AND step_type = 'ai_analysis'
        `,
        [workflowId]
      );

      for (const row of result.rows) {
        const config = row.step_config;

        if (config.modelId) {
          changes.push({
            nodeId: row.nodeId,
            changeType: 'add',
            description: `${config.modelId}のA/Bテストを作成`,
            reason: '異なる設定を比較して最適値を見つける',
            newConfig: {
              createVariants: true,
              variants: [
                { temperature: 0.3, description: '厳密' },
                { temperature: 0.7, description: 'バランス' },
                { temperature: 1.0, description: '創造的' }
              ]
            },
            expectedImpact: {
              timeSaved: 0,
              costReduction: 0,
              successIncrease: 0.05
            }
          });
        }
      }
    } catch (error) {
      console.error('Error generating A/B tests:', error);
    }

    return changes;
  }

  private async optimizeAINodes(workflowId: string, metrics: WorkflowMetrics): Promise<ProposedChange[]> {
    const changes: ProposedChange[] = [];

    try {
      const result = await query(
        `
        SELECT
          id as "nodeId",
          step_config
        FROM automation_workflow_steps
        WHERE workflow_id = $1
          AND step_type IN ('ai_analysis', 'ai_text_gen')
        `,
        [workflowId]
      );

      for (const row of result.rows) {
        const config = row.step_config;

        // Suggest switching to cheaper model if appropriate
        if (config.modelId === 'gpt-4' && metrics.nodeMetrics[row.nodeId]?.successRate > 0.95) {
          changes.push({
            nodeId: row.nodeId,
            changeType: 'modify',
            description: '安価なAIモデルへの切り替えを検討してください',
            reason: `成功率が高いため、GPT-3.5 Turboで十分です`,
            newConfig: { modelId: 'gpt-3.5-turbo' },
            expectedImpact: {
              timeSaved: 0,
              costReduction: 0.8, // 80% cost reduction
              successIncrease: -0.02
            }
          });
        }

        // Suggest reducing maxTokens if response is consistently short
        if (config.maxTokens > 500) {
          changes.push({
            nodeId: row.nodeId,
            changeType: 'modify',
            description: 'トークン使用量の削減を検討してください',
            reason: '現在のmaxTokensは大きすぎる可能性があります',
            newConfig: { maxTokens: 250 },
            expectedImpact: {
              timeSaved: 0,
              costReduction: 0.5,
              successIncrease: 0
            }
          });
        }
      }
    } catch (error) {
      console.error('Error optimizing AI nodes:', error);
    }

    return changes;
  }

  private async simplifyWorkflow(workflowId: string, metrics: WorkflowMetrics): Promise<ProposedChange[]> {
    const changes: ProposedChange[] = [];

    // Suggest removing redundant nodes
    const nodeResult = await query(
      `
      SELECT
        id,
        step_order
      FROM automation_workflow_steps
      WHERE workflow_id = $1
      ORDER BY step_order
      `,
      [workflowId]
    );

    const nodes = nodeResult.rows;
    if (nodes.length > 10) {
      changes.push({
        nodeId: nodes[5].id,
        changeType: 'remove',
        description: 'ワークフローが複雑すぎます。簡素化を検討してください',
        reason: `${nodes.length}ノードのワークフローは管理が困難です`,
        expectedImpact: {
          timeSaved: 60,
          costReduction: 0.3,
          successIncrease: 0.05
        }
      });
    }

    return changes;
  }

  private calculateExpectedImprovement(metrics: WorkflowMetrics, changes: ProposedChange[]): any {
    let efficiency = 0;
    let successRate = 0;
    let cost = 0;

    for (const change of changes) {
      if (change.expectedImpact) {
        efficiency += change.expectedImpact.timeSaved || 0;
        successRate += (change.expectedImpact.successIncrease || 0) * 100;
        cost += change.expectedImpact.costReduction || 0;
      }
    }

    return {
      efficiency: Math.min(efficiency / 300, 0.5), // Cap at 50% improvement
      successRate: Math.min(successRate / changes.length, 0.2), // Cap at 20% improvement
      cost: Math.min(cost / changes.length, 0.7) // Cap at 70% improvement
    };
  }

  private calculateConfidence(changes: ProposedChange[], metrics: WorkflowMetrics): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence if bottlenecks were found
    if (metrics.bottlenecks.length > 0) {
      confidence += 0.1;
    }

    // Decrease confidence if too many changes
    if (changes.length > 10) {
      confidence -= 0.1;
    }

    // Increase confidence if workflow has sufficient data
    if (metrics.totalRuns > 10) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  async saveOptimization(workflowId: string, optimization: WorkflowOptimization): Promise<void> {
    try {
      await query(
        `
        INSERT INTO workflow_optimizations (
          workflow_id,
          original_metrics,
          proposed_changes,
          expected_improvement,
          confidence,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        `,
        [
          workflowId,
          JSON.stringify(optimization.originalMetrics),
          JSON.stringify(optimization.proposedChanges),
          JSON.stringify(optimization.expectedImprovement),
          optimization.confidence
        ]
      );
    } catch (error) {
      console.error('Error saving optimization:', error);
    }
  }

  async applyOptimization(optimizationId: string): Promise<void> {
    try {
      // Get optimization details
      const result = await query(
        `
        SELECT workflow_id, proposed_changes
        FROM workflow_optimizations
        WHERE id = $1
        `,
        [optimizationId]
      );

      if (result.rows.length === 0) {
        return;
      }

      const { workflow_id, proposed_changes } = result.rows[0];
      const changes = JSON.parse(proposed_changes);

      // Apply changes to workflow
      for (const change of changes) {
        if (change.changeType === 'modify' && change.newConfig) {
          await query(
            `
            UPDATE automation_workflow_steps
            SET step_config = step_config || '{}' || $1
            WHERE id = $2
            `,
            [JSON.stringify(change.newConfig), change.nodeId]
          );
        }
      }

      // Mark as applied
      await query(
        `
        UPDATE workflow_optimizations
        SET status = 'applied',
            applied_at = NOW()
        WHERE id = $1
        `,
        [optimizationId]
      );
    } catch (error) {
      console.error('Error applying optimization:', error);
    }
  }
}

export default new WorkflowOptimizer();
