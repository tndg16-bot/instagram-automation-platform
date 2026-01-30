// Conversation Context Types
// Phase D: Conversation Context Management

/**
 * Conversation Context
 */
export interface ConversationContext {
  conversationId: string;
  userId: string;
  igUserId: string;
  history: ConversationMessage[];
  summary: ConversationSummary;
  intent: DetectedIntent;
  sentiment: SentimentTrend;
  entities: Entity[];
  stage: FunnelStage;
  lastUpdated: Date;
}

/**
 * Conversation Message
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Conversation Summary
 */
export interface ConversationSummary {
  topics: string[];
  keyPoints: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  stage: FunnelStage;
  summaryText: string;
}

/**
 * Detected Intent
 */
export interface DetectedIntent {
  category: string;
  confidence: number;
  keywords: string[];
  entities: Entity[];
}

/**
 * Sentiment Trend
 */
export interface SentimentTrend {
  current: 'positive' | 'neutral' | 'negative';
  score: number; // -1.0 to 1.0
  history: Array<{
    sentiment: string;
    score: number;
    timestamp: Date;
  }>;
}

/**
 * Funnel Stage
 */
export type FunnelStage =
  | 'awareness'     // 認知
  | 'consideration'  // 検討
  | 'decision'       // 決定
  | 'purchase'       // 購入
  | 'retention';     // リテンション

/**
 * Entity
 */
export interface Entity {
  type: 'user' | 'segment' | 'time' | 'content' | 'keyword' | 'product' | 'price';
  value: string;
  confidence: number;
  startPosition?: number;
  endPosition?: number;
}
