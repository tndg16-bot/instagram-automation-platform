// Conversation Context Engine
// Phase D: Conversation Context Management

import { query } from '../config/database';
import aiNodeService from './aiNodeService';
import conversationHistoryService from './conversationHistoryService';
import {
  ConversationContext,
  ConversationMessage,
  ConversationSummary,
  DetectedIntent,
  SentimentTrend,
  Entity,
  FunnelStage,
} from '../types/conversationContext';

/**
 * Conversation Context Engine
 * Maintains and updates conversation context for AI-powered interactions
 */
class ConversationContextEngine {
  async updateContext(
    conversationId: string,
    userId: string,
    igUserId: string,
    newMessage: ConversationMessage
  ): Promise<ConversationContext> {
    // 1. Add new message to history
    await conversationHistoryService.addMessage(conversationId, userId, igUserId, newMessage);

    // 2. Load existing conversation history
    const history = await conversationHistoryService.getHistory(conversationId);
    const updatedHistory = [...history, newMessage];

    // 3. Generate updated summary
    const summary = await this.generateSummary(updatedHistory);

    // 4. Detect intent
    const intent = await this.detectIntent(updatedHistory);

    // 5. Analyze sentiment
    const sentiment = await this.analyzeSentiment(updatedHistory);

    // 6. Extract entities
    const entities = await this.extractEntities(updatedHistory);

    // 7. Detect funnel stage
    const stage = this.detectFunnelStage(summary, intent);

    const context: ConversationContext = {
      conversationId,
      userId,
      igUserId,
      history: updatedHistory,
      summary,
      intent,
      sentiment,
      entities,
      stage,
      lastUpdated: new Date()
    };

    // 8. Save context
    await this.saveContext(context);

    return context;
  }

  async getContext(conversationId: string, userId: string): Promise<ConversationContext | null> {
    try {
      const result = await query(
        `
        SELECT
          conversation_id as "conversationId",
          user_id as "userId",
          ig_user_id as "igUserId",
          summary,
          intent,
          sentiment,
          entities,
          funnel_stage as "stage",
          last_updated as "lastUpdated"
        FROM conversation_contexts
        WHERE conversation_id = $1 AND user_id = $2
        `,
        [conversationId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const history = await conversationHistoryService.getHistory(conversationId);

      return {
        conversationId: row.conversationId,
        userId: row.userId,
        igUserId: row.igUserId,
        history,
        summary: JSON.parse(row.summary),
        intent: JSON.parse(row.intent),
        sentiment: JSON.parse(row.sentiment),
        entities: JSON.parse(row.entities),
        stage: row.stage,
        lastUpdated: new Date(row.lastUpdated)
      };
    } catch (error) {
      console.error('Error fetching conversation context:', error);
      return null;
    }
  }

  private async generateSummary(history: ConversationMessage[]): Promise<ConversationSummary> {
    const messages = history.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
以下の会話履歴を要約してください：

${messages}

出力（JSON）:
{
  "topics": [...],
  "keyPoints": [...],
  "openQuestions": [...],
  "sentiment": "positive|neutral|negative",
  "stage": "awareness|consideration|decision|purchase|retention",
  "summaryText": "..."
}
    `.trim();

    const response = await aiNodeService.generateText({
      model: { provider: 'openai', id: 'gpt-4' },
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 1000
    });

    return JSON.parse((response as any).output || '{}');
  }

  private async detectIntent(history: ConversationMessage[]): Promise<DetectedIntent> {
    const latestMessage = history[history.length - 1];

    const prompt = `
以下の最新メッセージから、ユーザーの意図を検出してください：

メッセージ: "${latestMessage.content}"

出力（JSON）:
{
  "category": "inquiry|purchase|support|complaint|casual",
  "confidence": 0.0-1.0,
  "keywords": [...],
  "entities": [...]
}
    `.trim();

    const response = await aiNodeService.generateText({
      model: { provider: 'openai', id: 'gpt-4' },
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 500
    });

    return JSON.parse((response as any).output || '{}');
  }

  private async analyzeSentiment(history: ConversationMessage[]): Promise<SentimentTrend> {
    const sentimentHistory: Array<{sentiment: string; score: number; timestamp: Date}> = [];

    for (const message of history) {
      const prompt = `
以下のメッセージの感情を分析してください：

メッセージ: "${message.content}"

出力（JSON）:
{
  "sentiment": "positive|neutral|negative",
  "score": -1.0 to 1.0
}
      `.trim();

      const response = await aiNodeService.generateText({
        model: { provider: 'openai', id: 'gpt-4' },
        userPrompt: prompt,
        temperature: 0.3,
        maxTokens: 100
      });

      const result = JSON.parse((response as any).output || '{}');
      sentimentHistory.push({
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        timestamp: message.timestamp
      });
    }

    const latest = sentimentHistory[sentimentHistory.length - 1];

    return {
      current: latest.sentiment as any,
      score: latest.score,
      history: sentimentHistory
    };
  }

  private async extractEntities(history: ConversationMessage[]): Promise<Entity[]> {
    const messages = history.map(m => m.content).join('\n');

    const prompt = `
以下の会話から重要なエンティティを抽出してください：

${messages}

出力（JSON）:
[
  {
    "type": "user|segment|time|content|keyword|product|price",
    "value": "...",
    "confidence": 0.0-1.0
  }
]
    `.trim();

    const response = await aiNodeService.generateText({
      model: { provider: 'openai', id: 'gpt-4' },
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 500
    });

    return JSON.parse((response as any).output || '[]');
  }

  private detectFunnelStage(summary: ConversationSummary, intent: DetectedIntent): FunnelStage {
    // Stage detection logic based on conversation content
    if (summary.openQuestions && summary.openQuestions.length > 2) {
      return 'awareness';
    }
    if (intent.category === 'purchase') {
      return 'decision';
    }
    if (intent.category === 'inquiry' && summary.topics.includes('price')) {
      return 'decision';
    }
    if (summary.topics.includes('feedback') || summary.topics.includes('support')) {
      return 'retention';
    }
    return 'consideration';
  }

  private async saveContext(context: ConversationContext): Promise<void> {
    try {
      await query(
        `
        INSERT INTO conversation_contexts (
          conversation_id,
          user_id,
          ig_user_id,
          summary,
          intent,
          sentiment,
          entities,
          funnel_stage,
          last_updated
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (conversation_id, user_id)
        DO UPDATE SET
          summary = EXCLUDED.summary,
          intent = EXCLUDED.intent,
          sentiment = EXCLUDED.sentiment,
          entities = EXCLUDED.entities,
          funnel_stage = EXCLUDED.funnel_stage,
          last_updated = NOW()
        `,
        [
          context.conversationId,
          context.userId,
          context.igUserId,
          JSON.stringify(context.summary),
          JSON.stringify(context.intent),
          JSON.stringify(context.sentiment),
          JSON.stringify(context.entities),
          context.stage
        ]
      );
    } catch (error) {
      console.error('Error saving conversation context:', error);
    }
  }

  async getConversationsByStage(userId: string, stage: FunnelStage): Promise<any[]> {
    try {
      const result = await query(
        `
        SELECT
          cc.conversation_id as "conversationId",
          cc.ig_user_id as "igUserId",
          cc.summary,
          cc.sentiment,
          cc.funnel_stage as "stage",
          cc.last_updated as "lastUpdated"
        FROM conversation_contexts cc
        WHERE cc.user_id = $1
          AND cc.funnel_stage = $2
        ORDER BY cc.last_updated DESC
        LIMIT 50
        `,
        [userId, stage]
      );

      return result.rows.map(row => ({
        conversationId: row.conversationId,
        igUserId: row.igUserId,
        summary: JSON.parse(row.summary),
        sentiment: JSON.parse(row.sentiment),
        stage: row.stage,
        lastUpdated: new Date(row.lastUpdated)
      }));
    } catch (error) {
      console.error('Error fetching conversations by stage:', error);
      return [];
    }
  }
}

export default new ConversationContextEngine();
