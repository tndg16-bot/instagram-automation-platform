// Workflow Engine Types for Phase 3

/**
 * Node Types
 */
export type NodeType =
  | 'trigger'      // Event or schedule trigger
  | 'action'       // Send DM, comment, etc.
  | 'condition'    // If/else branching
  | 'loop'         // For/while iteration
  | 'ai_text_gen'  // AI text generation
  | 'ai_text_analysis' // AI text analysis
  | 'ai_image_gen' // AI image generation
  | 'delay'        // Wait for time
  | 'variable'     // Set/get variables
  | 'http_request' // External API call
  | 'end';         // Workflow end

/**
 * Node Status
 */
export type NodeStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

/**
 * Workflow Status
 */
export type WorkflowStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'archived';

/**
 * Execution Status
 */
export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Trigger Types
 */
export type TriggerType =
  | 'event'        // Instagram webhook event
  | 'schedule'     // Cron schedule
  | 'manual';      // Manual trigger

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
 * Logical Operators
 */
export type LogicalOperator = 'AND' | 'OR';

/**
 * Workflow Definition
 */
export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow Trigger
 */
export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  config: {
    // For event triggers
    eventType?: 'comment' | 'dm' | 'follow' | 'mention' | 'like';
    // For schedule triggers
    cronExpression?: string;
    timezone?: string;
    // Common config
    instagramAccountId?: string;
    conditions?: TriggerCondition[];
  };
  enabled: boolean;
}

/**
 * Trigger Condition
 */
export interface TriggerCondition {
  id: string;
  field: string;
  operator: ComparisonOperator;
  value: any;
}

/**
 * Workflow Node
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  enabled: boolean;
}

/**
 * Node Config (polymorphic based on node type)
 */
export type NodeConfig =
  | TriggerNodeConfig
  | ActionNodeConfig
  | ConditionNodeConfig
  | LoopNodeConfig
  | AITextGenNodeConfig
  | AITextAnalysisNodeConfig
  | AIImageGenNodeConfig
  | DelayNodeConfig
  | VariableNodeConfig
  | HttpRequestNodeConfig
  | EndNodeConfig;

/**
 * Trigger Node Config
 */
export interface TriggerNodeConfig {
  triggerType: TriggerType;
  eventType?: string;
  cronExpression?: string;
}

/**
 * Action Node Config
 */
export interface ActionNodeConfig {
  actionType: 'send_dm' | 'reply_comment' | 'like_media' | 'follow_user' | 'unfollow_user';
  instagramAccountId: string;
  recipientId?: string;
  commentId?: string;
  mediaId?: string;
  message?: string;
  mediaUrl?: string;
}

/**
 * Condition Node Config
 */
export interface ConditionNodeConfig {
  logicalOperator: LogicalOperator;
  conditions: ConditionRule[];
  // Output branch IDs
  trueBranchNodeId?: string;
  falseBranchNodeId?: string;
}

/**
 * Condition Rule
 */
export interface ConditionRule {
  id: string;
  leftOperand: string; // Variable name or literal
  operator: ComparisonOperator;
  rightOperand: string; // Variable name or literal
  logicalOperator?: LogicalOperator; // For combining with next rule
}

/**
 * Loop Node Config
 */
export interface LoopNodeConfig {
  loopType: 'for_array' | 'for_range' | 'while';
  // For array
  arrayVariable?: string; // Variable containing array
  itemVariable?: string; // Variable name for each item
  // For range
  startValue?: number;
  endValue?: number;
  step?: number;
  indexVariable?: string;
  // For while
  condition?: ConditionRule;
  maxIterations?: number;
  // Next node after loop
  nextNodeId?: string;
}

/**
 * AI Text Generation Node Config
 */
export interface AITextGenNodeConfig {
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  variables: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  outputVariable?: string; // Variable name to store output
}

/**
 * AI Text Analysis Node Config
 */
export interface AITextAnalysisNodeConfig {
  modelId: string;
  textVariable?: string; // Variable containing text to analyze
  analysisType: 'sentiment' | 'entities' | 'keywords' | 'summarization' | 'classification';
  outputVariable?: string; // Variable name to store output
}

/**
 * AI Image Generation Node Config
 */
export interface AIImageGenNodeConfig {
  modelId: string;
  prompt: string;
  style?: 'realistic' | 'artistic' | 'anime' | 'minimalist';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  numberOfImages?: number;
  outputVariable?: string; // Variable name to store output URLs
}

/**
 * Delay Node Config
 */
export interface DelayNodeConfig {
  delayType: 'fixed' | 'random' | 'business_hours';
  // Fixed or random delay (in milliseconds)
  delayMs?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  // Business hours
  startHour?: number; // 0-23
  endHour?: number;   // 0-23
  timezone?: string;
  weekendsOnly?: boolean;
}

/**
 * Variable Node Config
 */
export interface VariableNodeConfig {
  operation: 'set' | 'get' | 'increment' | 'decrement';
  variableName: string;
  value?: any;
  // For increment/decrement
  step?: number;
}

/**
 * HTTP Request Node Config
 */
export interface HttpRequestNodeConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  outputVariable?: string; // Variable name to store response
}

/**
 * End Node Config
 */
export interface EndNodeConfig {
  result?: 'success' | 'failure';
  message?: string;
}

/**
 * Workflow Edge (connections between nodes)
 */
export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourceOutputId?: string; // For multi-output nodes (condition, loop)
  targetNodeId: string;
  targetInputId?: string;
}

/**
 * Workflow Variable
 */
export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  description?: string;
}

/**
 * Workflow Execution
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  triggerData?: any;
  variables: Record<string, any>;
  nodeExecutions: NodeExecution[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Node Execution
 */
export interface NodeExecution {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: NodeType;
  status: NodeStatus;
  input?: any;
  output?: any;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Template Library
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  workflow: Workflow;
  userId?: string; // Creator user ID
  isPublic: boolean;
  rating: number;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template Category
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder: number;
}

/**
 * Workflow Validation Result
 */
export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
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

/**
 * Workflow Validation Warning
 */
export interface WorkflowValidationWarning {
  nodeId?: string;
  edgeId?: string;
  type: 'optional_field' | 'performance_issue' | 'best_practice';
  message: string;
  details?: any;
}

/**
 * Execution Context
 */
export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  variables: Record<string, any>;
  currentNodeId?: string;
  history: NodeExecution[];
  triggerData?: any;
  metadata?: Record<string, any>;
}

/**
 * Execution Options
 */
export interface ExecutionOptions {
  debugMode?: boolean;
  dryRun?: boolean;
  maxExecutionTime?: number; // in milliseconds
  stopOnError?: boolean;
  continueOnNodeError?: boolean;
}
