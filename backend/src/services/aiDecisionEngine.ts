// AI Decision Engine Service
// Phase B: AI Decision Engine Enhancement

import { query } from '../config/database';
import aiNodeService from './aiNodeService';
import {
  AIDecisionContext,
  AIDecision,
  EnrichedContext,
  Predictions,
  TriggerData,
  WorkflowMetrics,
  UserBehaviorPattern,
  TimeFactors,
  TrendData,
  ExecutionHistoryItem,
  DecisionFeedback,
} from '../types/aiDecision';
import { AIModel, AVAILABLE_MODELS } from '../types/aiNode';

const GPT4_MODEL: AIModel = AVAILABLE_MODELS.openai[0];

class AIDecisionEngine {
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  async makeAIDecision(context: AIDecisionContext): Promise<AIDecision> {
    const startTime = Date.now();

    try {
      // Step 1: Enrich context
      const enrichedContext = await this.enrichContext(context);

      // Step 2: Get predictions from ML models
      const predictions = await this.getPredictions(enrichedContext);

      // Step 3: Generate decision using LLM
      const decision = await this.generateAIDecision(enrichedContext, predictions);

      // Step 4: Generate explanation
      const explanation = await this.explainAIDecision(decision, enrichedContext);

      // Step 5: Generate alternatives
      const alternatives = await this.generateAlternatives(enrichedContext, decision);

      // Step 6: Calculate confidence
      const confidence = this.calculateAIDecisionConfidence(decision, predictions, enrichedContext);

      return {
        nodeId: context.triggerData.nodeId,
        action: decision.action,
        confidence,
        reasoning: explanation,
        alternatives
      };
    } catch (error: any) {
      console.error('Error making AI decision:', error);
      throw error;
    }
  }

  private async enrichContext(context: AIDecisionContext): Promise<EnrichedContext> {
    const executionId = context.executionId || `exec-${Date.now()}`;
    const enriched: EnrichedContext = {
      ...context,
      executionId,
      behaviorPatterns: null,
      workflowMetrics: null,
      conversationHistory: [],
      timeFactors: null,
      currentTrends: null
    };

    // 1. Fetch user behavior patterns
    try {
      enriched.behaviorPatterns = await this.getUserBehaviorPatterns(context.userId);
    } catch (error: any) {
      console.error('Error in behavior patterns fetch:', error);
      enriched.behaviorPatterns = null;
    }

    // 2. Get workflow performance metrics
    try {
      enriched.workflowMetrics = await this.getWorkflowMetrics(context.workflowId);
    } catch (error: any) {
      console.error('Error in workflow metrics fetch:', error);
      enriched.workflowMetrics = null;
    }

    // 3. Retrieve conversation history
    try {
      const history = await this.getConversationHistory(context.triggerData.conversationId || '');
      // Convert ExecutionHistoryItem[] to ConversationMessage[]
      enriched.conversationHistory = history.map(item => ({
        id: item.id,
        role: item.status === 'success' ? 'assistant' : 'user',
        content: JSON.stringify(item.triggerData),
        timestamp: item.startedAt
      }));
    } catch (error: any) {
      console.error('Error in conversation history fetch:', error);
      enriched.conversationHistory = [];
    }

    // 4. Calculate time-based factors
    enriched.timeFactors = this.calculateTimeFactors();

    // 5. Get current trends
    try {
      enriched.currentTrends = await this.getCurrentTrends(context.userId);
    } catch (error: any) {
      console.error('Error in trends fetch:', error);
      enriched.currentTrends = null;
    }

    return enriched;
  }

  private calculateTimeFactors(): TimeFactors {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Time zones (all JST)
    const isBusinessHour = hour >= 9 && hour < 18;
    const isPrimeTime = (hour >= 19 && hour < 23) || (hour >= 6 && hour < 8);

    return {
      hour,
      dayOfWeek,
      isWeekend,
      isBusinessHour,
      isPrimeTime,
      timezone: 'Asia/Tokyo'
    };
  }

  private async getPredictions(context: EnrichedContext): Promise<Predictions> {
    const predictions: Predictions = {
      engagementScore: 0,
      sentiment: { label: 'neutral', score: 0 },
      responseProbability: 0,
      conversionProbability: 0
    };

    // 1. Engagement prediction (mock - integrate with actual ML model)
    if (context.workflowMetrics) {
      const avgEngagement = context.workflowMetrics.averageExecutionTime || 50;
      const recentPerformance = context.workflowMetrics.successRate || 0.8;
      predictions.engagementScore = avgEngagement * recentPerformance;
    }

    // 2. Sentiment prediction (use AI)
    if (context.triggerData.content) {
      const sentimentResult = await aiNodeService.analyzeText({
        model: GPT4_MODEL,
        text: context.triggerData.content,
        analysisType: 'sentiment'
      });

      if (sentimentResult.success && sentimentResult.output) {
        predictions.sentiment = sentimentResult.output as any;
      }
    }

    // 3. Response probability (based on user behavior)
    if (context.behaviorPatterns) {
      const avgResponseRate = context.behaviorPatterns.averageResponseRate || 0.3;
      predictions.responseProbability = avgResponseRate;
    }

    // 4. Conversion probability (based on funnel stage)
    if (context.triggerData.funnelStage) {
      const conversionByStage: Record<string, number> = {
        awareness: 0.1,
        consideration: 0.3,
        decision: 0.6,
        purchase: 0.2,
        retention: 0.05
      };
      predictions.conversionProbability = conversionByStage[context.triggerData.funnelStage] || 0.1;
    }

    return predictions;
  }

  private async generateAIDecision(
    context: EnrichedContext,
    predictions: Predictions
  ): Promise<AIDecision> {
    const prompt = this.buildAIDecisionPrompt(context, predictions);

    const response = await aiNodeService.generateText({
      model: GPT4_MODEL,
      systemPrompt: this.getAIDecisionSystemPrompt(),
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 1500
    });

    // Parse AI response
    const decision = JSON.parse((response as any).output || '{}');

    return decision;
  }

  private buildAIDecisionPrompt(context: EnrichedContext, predictions: Predictions): string {
    const parts: string[] = [];

    parts.push('## 文脈情報');
    parts.push(`- ワークフローの目的: ${context.triggerData.workflowPurpose || 'Instagram運用の自動化'}`);

    if (context.workflowMetrics) {
      parts.push(`- 実行回数: ${context.workflowMetrics.totalRuns}`);
      parts.push(`- 成功率: ${context.workflowMetrics.successRate ? `${context.workflowMetrics.successRate * 100}%` : 'N/A'}`);
    }

    parts.push('\n## 現在のデータ');

    if (context.triggerData.content) {
      parts.push(`- コンテンツ: "${context.triggerData.content}"`);
      parts.push(`- 感情: ${predictions.sentiment?.label || '未知'} (スコア: ${predictions.sentiment?.score || 0})`);
    }

    parts.push(`- エンゲージメント予測: ${predictions.engagementScore.toFixed(3)}`);

    if (context.behaviorPatterns) {
      parts.push(`- ユーザーの平均レスポンス率: ${context.behaviorPatterns.averageResponseRate ? `${(context.behaviorPatterns.averageResponseRate * 100).toFixed(1)}%` : 'N/A'}`);
      parts.push(`- 好みのアクションタイプ: ${context.behaviorPatterns.preferredActionTypes?.join(', ')}`);
    }

    if (context.timeFactors) {
      parts.push(`- 現在時刻: ${context.timeFactors ? `${context.timeFactors.hour}時` : '未知'}`);
      parts.push(`- 曜日: ${context.timeFactors ? this.getDayOfWeekName(context.timeFactors.dayOfWeek) : '未知'}`);
      parts.push(`- プライムタイム: ${context.timeFactors?.isPrimeTime ? 'YES' : 'NO'}`);
    }

    parts.push('\n## 選択肢');
    parts.push('1. DMを送信する');
    parts.push('2. コメントに返信する');
    parts.push('3. いいねする');
    parts.push('4. フォローする');
    parts.push('5. 何もしない');

    parts.push('\n## 出力形式（JSON）:');
    parts.push(`{
  "action": "send_dm|reply_comment|like|follow|none",
  "confidence": 0.0-1.0,
  "reasoning": "...",
  "considerations": ["..."]
}`);

    return parts.join('\n');
  }

  private getAIDecisionSystemPrompt(): string {
    return `あなたはInstagram自動化ワークフローの意思決定アシスタントです。

以下の原則に従ってください：

1. **ユーザーの最適な体験を優先**: スパム行為にならないよう注意してください
2. **文脈を考慮**: 時間、ユーザー行動、過去の実績を反映してください
3. **コスト効率**: 高価なAIモデルは慎重に使用してください
4. **透明性**: 決定の理由を明確に説明してください
5. **安全**: ユーザーのプライバシーとガイドラインを守ってください

決定に際、常に以下を検討してください：
- このタイミングで適切か？
- ユーザーの過去の行動と一致するか？
- 成功する可能性は高いか？
- コストに見合うか？`;
  }

  private async explainAIDecision(
    decision: AIDecision,
    context: EnrichedContext
  ): Promise<string> {
    const prompt = `
以下の意思決定について、ユーザーに説明できる形で理由を説明してください：

決定: ${decision.action}
信頼度: ${decision.confidence}
考慮事項: ${decision.alternatives ? decision.alternatives.join(', ') : 'なし'}

## 文脈:
- 感情: ${context.triggerData?.sentiment || '未知'}
- 時間: ${context.timeFactors ? `${context.timeFactors.hour}時` : '未知'}
- ユーザー行動: ${context.behaviorPatterns ? `レスポンス率${context.behaviorPatterns.averageResponseRate ? (context.behaviorPatterns.averageResponseRate * 100).toFixed(1) : 0}%` : '未知'}

説明:
  - 要約（1-2文）
  - 主要な要因
  - リスク要因
  - ユーザーへの推奨
    `.trim();

    const response = await aiNodeService.generateText({
      model: GPT4_MODEL,
      userPrompt: prompt,
      temperature: 0.5,
      maxTokens: 500
    });

    const explanation = JSON.parse((response as any).output || '{}');

    return [
      `要約: ${explanation.summary}`,
      `主要な要因: ${explanation.keyFactors?.join(', ')}`,
      `リスク: ${explanation.riskFactors?.join(', ')}`,
      `推奨: ${explanation.recommendation || 'なし'}`
    ].join('\n');
  }

  private async generateAlternatives(
    context: EnrichedContext,
    primaryAIDecision: AIDecision
  ): Promise<AIDecision[]> {
    const alternatives: AIDecision[] = [];

    // Alternative 1: Different AI model
    if (primaryAIDecision.action !== 'none') {
      alternatives.push({
        nodeId: context.triggerData.nodeId,
        action: primaryAIDecision.action,
        confidence: primaryAIDecision.confidence * 0.95,
        reasoning: 'Claude 3 Opusを使用（コスト効率改善）',
        alternatives: []
      });
    }

    // Alternative 2: Conservative approach
    if (primaryAIDecision.action !== 'none') {
      alternatives.push({
        nodeId: context.triggerData.nodeId,
        action: primaryAIDecision.action === 'send_dm' ? 'none' : 'send_dm',
        confidence: 0.7,
        reasoning: 'より保守的なアプローチ',
        alternatives: []
      });
    }

    // Alternative 3: Different timing
    alternatives.push({
      nodeId: context.triggerData.nodeId,
      action: 'reply_comment',
      confidence: 0.8,
      reasoning: '営業時間内に返信をスケジュール',
      alternatives: []
    });

    return alternatives;
  }

  private calculateAIDecisionConfidence(
    decision: AIDecision,
    predictions: Predictions,
    context: EnrichedContext
  ): number {
    let confidence = decision.confidence || 0.5;

    // Adjust based on sentiment
    if (predictions.sentiment && predictions.sentiment.score > 0.7) {
      confidence += 0.1;
    } else if (predictions.sentiment && predictions.sentiment.score < -0.7) {
      confidence -= 0.1;
    }

    // Adjust based on user behavior match
    if (context.behaviorPatterns) {
      const behaviorMatch = this.calculateBehaviorMatch(decision, context.behaviorPatterns);
      confidence += behaviorMatch * 0.15;
    }

    // Adjust based on time factors
    if (context.timeFactors && context.timeFactors.isBusinessHour) {
      confidence += 0.05;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private calculateBehaviorMatch(decision: AIDecision, patterns: UserBehaviorPattern | null): number {
    // Check if decision matches user's preferred actions
    if (patterns && patterns.preferredActionTypes && patterns.preferredActionTypes.includes(decision.action)) {
      return 1.0;
    }

    // Check if similar actions were successful
    if (patterns && patterns.actionSuccessRates) {
      const similarSuccessRate = patterns.actionSuccessRates[decision.action] || 0;
      return similarSuccessRate;
    }

    return 0;
  }

  private sanitizeContext(context: EnrichedContext): Partial<EnrichedContext> {
    const sanitized: any = { ...context };

    // Remove sensitive data
    if (sanitized.executionHistory) {
      delete sanitized.executionHistory;
    }
    if (sanitized.triggerData?.userId) {
      delete sanitized.triggerData.userId;
    }

    // Truncate long arrays
    if (sanitized.conversationHistory && sanitized.conversationHistory.length > 10) {
      sanitized.conversationHistory = sanitized.conversationHistory.slice(-10);
    }

    return sanitized;
  }

  private getDayOfWeekName(day: number): string {
    const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    return days[day];
  }

  async getUserBehaviorPatterns(userId: string): Promise<UserBehaviorPattern | null> {
    // TODO: Implement user behavior pattern service
    return null;
  }

  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics | null> {
    // TODO: Implement workflow metrics service
    return null;
  }

  async getConversationHistory(conversationId: string): Promise<ExecutionHistoryItem[]> {
    // TODO: Implement conversation history service
    return [];
  }

  async getCurrentTrends(userId: string): Promise<TrendData | null> {
    // TODO: Implement trends service
    return null;
  }
}

export default new AIDecisionEngine();
