// Workflow Recommendation Engine
// Phase C: Smart Recommendation System

import { query } from '../config/database';
import aiNodeService from './aiNodeService';

interface RecommendationContext {
  userId: string;
  currentWorkflows: any[];
  activity: UserActivity;
  goals: UserGoal[];
  industry?: string;
}

interface UserActivity {
  averageMonthlyPosts?: number;
  averageMonthlyDMs?: number;
  hasUsedAutomation?: boolean;
  hasUsedAnalytics?: boolean;
  hasUsedEngagement?: boolean;
  instagramAccounts?: number;
  tags?: string[];
  interests?: string[];
}

interface UserGoal {
  type: 'growth' | 'engagement' | 'sales' | 'automation';
  target?: string;
  timeframe?: string;
}

interface WorkflowRecommendation {
  workflow: any;
  reason: string;
  expectedImpact: {
    timeSaved: number; // minutes per week
    engagementIncrease: number; // percentage
  };
  difficulty: 'easy' | 'medium' | 'advanced';
  tags: string[];
}

/**
 * Workflow Recommendation Engine
 * Generates personalized workflow recommendations
 */
class WorkflowRecommendationEngine {
  async generateRecommendations(
    context: RecommendationContext
  ): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    // 1. Pattern-based recommendations
    const patternRecommendations = await this.analyzePatterns(context);
    recommendations.push(...patternRecommendations);

    // 2. Performance-based recommendations
    const perfRecommendations = await this.analyzePerformance(context);
    recommendations.push(...perfRecommendations);

    // 3. Trend-based recommendations
    const trendRecommendations = await this.analyzeTrends(context);
    recommendations.push(...trendRecommendations);

    // 4. Personalized suggestions
    const personalized = await this.generatePersonalized(context);
    recommendations.push(...personalized);

    // Rank by expected impact
    return this.rankRecommendations(recommendations);
  }

  private async analyzePatterns(context: RecommendationContext): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    // Detect repeated manual actions (simplified)
    if (context.activity.averageMonthlyPosts > 10 && !context.activity.hasUsedAutomation) {
      recommendations.push({
        workflow: this.buildAutomatedPostWorkflow(context),
        reason: `月平均${context.activity.averageMonthlyPosts}回の投稿実績があります。自動化で時間を節約できます。`,
        expectedImpact: {
          timeSaved: 180, // 3 hours per week
          engagementIncrease: 0.15, // 15% increase
        },
        difficulty: 'easy',
        tags: ['automation', 'time-saving', 'growth']
      });
    }

    // DM automation opportunity
    if (context.activity.averageMonthlyDMs > 20 && !context.activity.hasUsedAutomation) {
      recommendations.push({
        workflow: this.buildDMAutomationWorkflow(context),
        reason: `月平均${context.activity.averageMonthlyDMs}回のDM送信実績があります。テンプレート自動化で効率化できます。`,
        expectedImpact: {
          timeSaved: 240, // 4 hours per week
          engagementIncrease: 0.25, // 25% increase
        },
        difficulty: 'medium',
        tags: ['automation', 'dm', 'engagement']
      });
    }

    // Comment automation opportunity
    if (context.activity.averageMonthlyPosts > 5) {
      recommendations.push({
        workflow: this.buildCommentReplyWorkflow(context),
        reason: 'コメントへの返信を自動化することで、エンゲージメントを向上できます。',
        expectedImpact: {
          timeSaved: 60, // 1 hour per week
          engagementIncrease: 0.30, // 30% increase
        },
        difficulty: 'easy',
        tags: ['automation', 'comments', 'engagement']
      });
    }

    return recommendations;
  }

  private async analyzePerformance(context: RecommendationContext): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    // Analyze existing workflows for optimization
    for (const workflow of context.currentWorkflows) {
      if (workflow.successful_runs && workflow.total_runs) {
        const successRate = workflow.successful_runs / workflow.total_runs;

        if (successRate < 0.7) {
          recommendations.push({
            workflow: this.buildOptimizationWorkflow(workflow),
            reason: `"${workflow.name}" の成功率が ${(successRate * 100).toFixed(0)}% です。最適化で改善できます。`,
            expectedImpact: {
              timeSaved: 30, // 30 minutes per week
              engagementIncrease: 0.20, // 20% increase
            },
            difficulty: 'medium',
            tags: ['optimization', 'performance']
          });
        }
      }
    }

    return recommendations;
  }

  private async analyzeTrends(context: RecommendationContext): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    try {
      // Get trending workflows from similar users
      const result = await query(
        `
        SELECT
          aw.id,
          aw.name,
          aw.trigger_type,
          aw.total_runs,
          aw.successful_runs,
          COUNT(eh.id) as executions,
          AVG(CASE WHEN eh.execution_status = 'completed' THEN 1.0 ELSE 0.0 END) as "successRate"
        FROM automation_workflows aw
        LEFT JOIN execution_history eh ON aw.id = eh.workflow_id
          AND eh.start_time > NOW() - INTERVAL '30 days'
        WHERE aw.user_id IN (
          SELECT DISTINCT user_id
          FROM automation_workflows
          WHERE user_id != $1
            AND created_at > NOW() - INTERVAL '90 days'
          LIMIT 20
        )
        GROUP BY aw.id, aw.name, aw.trigger_type, aw.total_runs, aw.successful_runs
        ORDER BY executions DESC, "successRate" DESC
        LIMIT 5
        `,
        [context.userId]
      );

      for (const row of result.rows) {
        if (row.total_runs > 10 && row.successful_runs / row.total_runs > 0.8) {
          recommendations.push({
            workflow: {
              id: row.id,
              name: row.name,
              triggerType: row.trigger_type
            },
            reason: `類似ユーザーが採用している成功ワークフロー (成功率: ${(row.successRate * 100).toFixed(0)}%)`,
            expectedImpact: {
              timeSaved: 60,
              engagementIncrease: parseFloat(row.successRate) || 0.2
            },
            difficulty: 'medium',
            tags: ['trending', 'social-proof']
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing trends:', error);
    }

    return recommendations;
  }

  private async generatePersonalized(context: RecommendationContext): Promise<WorkflowRecommendation[]> {
    const recommendations: WorkflowRecommendation[] = [];

    // AI-powered personalized recommendations
    for (const goal of context.goals) {
      if (goal.type === 'growth') {
        recommendations.push({
          workflow: this.buildGrowthWorkflow(context),
          reason: `「${goal.target || 'フォロワー増加'}」という目標に最適な自動化フローです。`,
          expectedImpact: {
            timeSaved: 90,
            engagementIncrease: 0.35
          },
          difficulty: 'medium',
          tags: ['growth', 'personalized']
        });
      } else if (goal.type === 'engagement') {
        recommendations.push({
          workflow: this.buildEngagementWorkflow(context),
          reason: 'エンゲージメント最大化のための自動化フローです。',
          expectedImpact: {
            timeSaved: 60,
            engagementIncrease: 0.40
          },
          difficulty: 'easy',
          tags: ['engagement', 'personalized']
        });
      } else if (goal.type === 'sales') {
        recommendations.push({
          workflow: this.buildSalesWorkflow(context),
          reason: 'コンバージョン率向上のための自動化フローです。',
          expectedImpact: {
            timeSaved: 120,
            engagementIncrease: 0.25
          },
          difficulty: 'advanced',
          tags: ['sales', 'conversion', 'personalized']
        });
      }
    }

    return recommendations;
  }

  private rankRecommendations(recommendations: WorkflowRecommendation[]): WorkflowRecommendation[] {
    // Score and sort recommendations
    const scored = recommendations.map(rec => {
      let score = 0;

      // Expected impact score
      score += rec.expectedImpact.timeSaved / 60 * 0.4; // Hours saved
      score += rec.expectedImpact.engagementIncrease * 100 * 0.6; // Engagement increase

      // Difficulty penalty (easier is better)
      if (rec.difficulty === 'easy') score += 0.5;
      if (rec.difficulty === 'medium') score += 0.2;
      if (rec.difficulty === 'advanced') score -= 0.1;

      // Personalization bonus
      if (rec.tags.includes('personalized')) score += 1.0;

      // Social proof bonus
      if (rec.tags.includes('trending')) score += 0.8;

      return { ...rec, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score, ...rest }) => rest);
  }

  private buildAutomatedPostWorkflow(context: RecommendationContext): any {
    return {
      id: 'rec-auto-post',
      name: '投稿自動化ワークフロー',
      description: '定期的な投稿を自動作成・公開',
      triggerType: 'schedule',
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 } },
        { id: 'ai-1', type: 'ai_text_gen', position: { x: 450, y: 150 } },
        { id: 'action-1', type: 'action', position: { x: 650, y: 250 } }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-1' },
        { id: 'e2', source: 'ai-1', target: 'action-1' }
      ]
    };
  }

  private buildDMAutomationWorkflow(context: RecommendationContext): any {
    return {
      id: 'rec-dm-auto',
      name: 'DM一斉配信ワークフロー',
      description: 'テンプレートを使用したDM一斉送信',
      triggerType: 'manual',
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 } },
        { id: 'ai-1', type: 'ai_text_gen', position: { x: 450, y: 150 } },
        { id: 'action-1', type: 'action', position: { x: 650, y: 250 } }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-1' },
        { id: 'e2', source: 'ai-1', target: 'action-1' }
      ]
    };
  }

  private buildCommentReplyWorkflow(context: RecommendationContext): any {
    return {
      id: 'rec-comment-auto',
      name: 'コメント自動返信ワークフロー',
      description: '新着コメントへのAI生成返信',
      triggerType: 'event',
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 } },
        { id: 'ai-1', type: 'ai_text_gen', position: { x: 450, y: 150 } },
        { id: 'condition-1', type: 'condition', position: { x: 650, y: 250 } },
        { id: 'action-1', type: 'action', position: { x: 850, y: 350 } }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-1' },
        { id: 'e2', source: 'ai-1', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'action-1' }
      ]
    };
  }

  private buildGrowthWorkflow(context: RecommendationContext): any {
    return {
      id: 'rec-growth',
      name: 'フォロワー増長ワークフロー',
      description: '自動フォロー・いいね返しによるフォロワー増加',
      triggerType: 'schedule',
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 } },
        { id: 'ai-1', type: 'ai_analysis', position: { x: 450, y: 150 } },
        { id: 'action-1', type: 'action', position: { x: 650, y: 250 } },
        { id: 'action-2', type: 'action', position: { x: 650, y: 350 } }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-1' },
        { id: 'e2', source: 'ai-1', target: 'action-1' },
        { id: 'e3', source: 'ai-1', target: 'action-2' }
      ]
    };
  }

  private buildEngagementWorkflow(context: RecommendationContext): any {
    return {
      id: 'rec-engagement',
      name: 'エンゲージメント向上ワークフロー',
      description: 'タイムライン最適時間でのアクション実行',
      triggerType: 'schedule',
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 } },
        { id: 'ai-1', type: 'ai_analysis', position: { x: 450, y: 150 } },
        { id: 'action-1', type: 'action', position: { x: 650, y: 250 } }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-1' },
        { id: 'e2', source: 'ai-1', target: 'action-1' }
      ]
    };
  }

  private buildSalesWorkflow(context: RecommendationContext): any {
    return {
      id: 'rec-sales',
      name: 'コンバージョン向上ワークフロー',
      description: 'DMステップシーケンスによるコンバージョン',
      triggerType: 'event',
      nodes: [
        { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 } },
        { id: 'condition-1', type: 'condition', position: { x: 450, y: 150 } },
        { id: 'ai-1', type: 'ai_text_gen', position: { x: 650, y: 250 } },
        { id: 'action-1', type: 'action', position: { x: 850, y: 350 } },
        { id: 'delay-1', type: 'delay', position: { x: 850, y: 450 } },
        { id: 'action-2', type: 'action', position: { x: 850, y: 550 } }
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2', source: 'condition-1', target: 'ai-1' },
        { id: 'e3', source: 'ai-1', target: 'action-1' },
        { id: 'e4', source: 'action-1', target: 'delay-1' },
        { id: 'e5', source: 'delay-1', target: 'action-2' }
      ]
    };
  }

  private buildOptimizationWorkflow(existingWorkflow: any): any {
    return {
      id: `opt-${existingWorkflow.id}`,
      name: `${existingWorkflow.name} (最適化版)`,
      description: 'AI提案による最適化済みワークフロー',
      triggerType: existingWorkflow.trigger_type,
      nodes: existingWorkflow.nodes,
      edges: existingWorkflow.edges
    };
  }

  async saveRecommendation(
    userId: string,
    recommendation: WorkflowRecommendation,
    source: string
  ): Promise<void> {
    try {
      await query(
        `
        INSERT INTO workflow_recommendations (
          user_id,
          recommendation_type,
          recommended_workflow,
          reason,
          expected_impact,
          difficulty,
          tags,
          source,
          viewed,
          applied,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, NOW())
        `,
        [
          userId,
          'personalized',
          JSON.stringify(recommendation.workflow),
          recommendation.reason,
          JSON.stringify(recommendation.expectedImpact),
          recommendation.difficulty,
          JSON.stringify(recommendation.tags),
          source
        ]
      );
    } catch (error) {
      console.error('Error saving recommendation:', error);
    }
  }
}

export default new WorkflowRecommendationEngine();
