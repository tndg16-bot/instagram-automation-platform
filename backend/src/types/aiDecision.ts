// AI Decision Engine Types
// Phase B: AI Decision Engine Enhancement

/**
 * AI Decision Context
 */
export interface AIDecisionContext {
  workflowId: string;
  executionId?: string;
  userId: string;
  triggerData: TriggerData;
  executionHistory: ExecutionHistoryItem[];
  userBehavior: UserBehaviorPattern | null;
  conversationContext: ConversationContext | null;
  timeFactors: TimeFactors;
  currentTrends: TrendData | null;
}

/**
 * Trigger Data
 */
export interface TriggerData {
  nodeId: string;
  workflowPurpose?: string;
  conversationId?: string;
  content?: string;
  sentiment?: SentimentData;
  userId?: string;
  igUserId?: string;
  funnelStage?: FunnelStage;
  timestamp: Date;
}

/**
 * Funnel Stages
 */
export type FunnelStage =
  | 'awareness'     // 認知
  | 'consideration'  // 検討
  | 'decision'       // 決定
  | 'purchase'       // 購入
  | 'retention';     // リテンション

/**
 * AI Decision
 */
export interface AIDecision {
  nodeId: string;
  action: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    action: string;
    confidence: number;
    reason?: string;
  }>;
}

/**
 * Enriched Context
 */
export interface EnrichedContext {
  executionId: string;
  workflowId: string;
  userId: string;
  triggerData: TriggerData;
  behaviorPatterns: UserBehaviorPattern | null;
  workflowMetrics: WorkflowMetrics | null;
  conversationHistory: ConversationMessage[];
  timeFactors: TimeFactors | null;
  currentTrends: TrendData | null;
  metadata?: Record<string, any>;
}

/**
 * Predictions
 */
export interface Predictions {
  engagementScore: number;
  sentiment: SentimentData;
  responseProbability: number;
  conversionProbability: number;
}

/**
 * Sentiment Data
 */
export interface SentimentData {
  label: 'positive' | 'neutral' | 'negative';
  score: number; // -1.0 to 1.0
}

/**
 * Workflow Metrics
 */
export interface WorkflowMetrics {
  totalRuns: number;
  successRate: number;
  averageExecutionTime: number;
  averageEngagement: number;
  recentSuccessRate: number;
  failureRate: number;
}

/**
 * User Behavior Pattern
 */
export interface UserBehaviorPattern {
  userId: string;
  actionTypes: string[];
  averageResponseRate: number;
  preferredActionTypes: string[];
  actionSuccessRates: Record<string, number>;
  preferredTimeOfDay: number;
  preferredDayOfWeek: number;
  lastAnalyzed: Date;
}

/**
 * Time Factors
 */
export interface TimeFactors {
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isBusinessHour: boolean;
  isPrimeTime: boolean;
  timezone: string;
}

/**
 * Trend Data
 */
export interface TrendData {
  trendingActions: string[];
  popularWorkflows: string[];
  successfulPatterns: string[];
  timestamp: Date;
}

/**
 * Execution History Item
 */
export interface ExecutionHistoryItem {
  id: string;
  workflowId: string;
  userId: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number;
  triggerData: any;
  result: any;
  error?: string;
}

/**
 * Decision Feedback
 */
export interface DecisionFeedback {
  decisionId: string;
  actualOutcome: 'positive' | 'neutral' | 'negative';
  userCorrection?: string;
  metrics?: {
    engagement?: number;
    responseRate?: number;
    conversion?: number;
  };
}

// Import necessary types
import { Workflow } from './workflow';
import { AIModel } from './aiNode';
import { ConversationContext, ConversationMessage } from './conversationContext';
