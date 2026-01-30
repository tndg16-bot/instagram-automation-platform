// Natural Language Workflow Generator Types
// Phase A: Natural Language Workflow Generation

/**
 * Parsed Intent from natural language description
 */
export interface ParsedIntent {
  trigger: TriggerInfo;
  conditions: ConditionInfo[];
  actions: ActionInfo[];
  confidence: number;
  extractedEntities: Entity[];
}

/**
 * Trigger Information
 */
export interface TriggerInfo {
  type: 'event' | 'schedule' | 'manual';
  eventType?: 'comment' | 'dm' | 'follow' | 'mention' | 'like';
  schedule?: {
    expression: string;
    timezone: string;
  };
  description: string;
}

/**
 * Condition Information
 */
export interface ConditionInfo {
  id: string;
  field: string;
  operator: ComparisonOperator;
  value: any;
  description: string;
  confidence: number;
}

/**
 * Action Information
 */
export interface ActionInfo {
  id: string;
  type: 'send_dm' | 'reply_comment' | 'like_media' | 'follow_user' | 'unfollow_user';
  params: Record<string, any>;
  description: string;
  order: number;
}

/**
 * Extracted Entity
 */
export interface Entity {
  type: 'user' | 'segment' | 'time' | 'content' | 'keyword';
  value: string;
  confidence: number;
  startPosition: number;
  endPosition: number;
}

/**
 * Comparison Operators
 */
export type ComparisonOperator =
  | 'eq'           // Equal
  | 'ne'           // Not equal
  | 'gt'           // Greater than
  | 'gte'          // Greater than or equal
  | 'lt'           // Less than
  | 'lte'          // Less than or equal
  | 'contains'     // String contains
  | 'not_contains' // String does not contain
  | 'matches'      // Regex matches
  | 'not_matches'; // Regex does not match

/**
 * Workflow Generation Options
 */
export interface GenerationOptions {
  userId: string;
  language?: string;
  workflowName?: string;
  instagramAccountId?: string;
  includeAI?: boolean;
  aiModel?: AIModel;
  conversationContext?: ConversationContext;
}

/**
 * Workflow Generation Result
 */
export interface WorkflowGenerationResult {
  workflow: Workflow | null;
  confidence: number;
  alternatives: Workflow[];
  explanation: string;
  parsingDetails?: {
    parsed: ParsedIntent;
    validation: WorkflowValidationResult;
    generationTime: number;
  };
  error?: string;
  success: boolean;
}

/**
 * Workflow Validation Result
 */
export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationError[];
}

/**
 * Workflow Validation Error
 */
export interface WorkflowValidationError {
  nodeId?: string;
  edgeId?: string;
  type: 'missing_node' | 'missing_connection' | 'invalid_config' | 'cycle_detected' | 'orphan_node';
  message: string;
  details?: any;
}

// Import workflow types
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
} from './workflow';
import { AIModel } from './aiNode';

import { ConversationContext } from './conversationContext';
