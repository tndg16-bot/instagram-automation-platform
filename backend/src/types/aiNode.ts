// AI Step Node Types for Phase 3

/**
 * Supported AI Model Providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google';

/**
 * Supported AI Models
 */
export interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  maxTokens: number;
  supportsStreaming: boolean;
  costPer1kTokens: number;
}

export const AVAILABLE_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: 'gpt-4',
      provider: 'openai',
      name: 'GPT-4',
      maxTokens: 8192,
      supportsStreaming: true,
      costPer1kTokens: 0.03,
    },
    {
      id: 'gpt-4-turbo',
      provider: 'openai',
      name: 'GPT-4 Turbo',
      maxTokens: 128000,
      supportsStreaming: true,
      costPer1kTokens: 0.01,
    },
    {
      id: 'gpt-3.5-turbo',
      provider: 'openai',
      name: 'GPT-3.5 Turbo',
      maxTokens: 4096,
      supportsStreaming: true,
      costPer1kTokens: 0.002,
    },
  ],
  anthropic: [
    {
      id: 'claude-3-opus',
      provider: 'anthropic',
      name: 'Claude 3 Opus',
      maxTokens: 200000,
      supportsStreaming: true,
      costPer1kTokens: 0.015,
    },
    {
      id: 'claude-3-sonnet',
      provider: 'anthropic',
      name: 'Claude 3 Sonnet',
      maxTokens: 200000,
      supportsStreaming: true,
      costPer1kTokens: 0.003,
    },
    {
      id: 'claude-3-haiku',
      provider: 'anthropic',
      name: 'Claude 3 Haiku',
      maxTokens: 200000,
      supportsStreaming: true,
      costPer1kTokens: 0.00025,
    },
  ],
  google: [
    {
      id: 'gemini-pro',
      provider: 'google',
      name: 'Gemini Pro',
      maxTokens: 91728,
      supportsStreaming: true,
      costPer1kTokens: 0.001,
    },
    {
      id: 'gemini-ultra',
      provider: 'google',
      name: 'Gemini Ultra',
      maxTokens: 1048576,
      supportsStreaming: true,
      costPer1kTokens: 0.002,
    },
  ],
};

/**
 * AI Node Types
 */
export type AINodeType =
  | 'text_generation'
  | 'text_analysis'
  | 'image_generation'
  | 'text_to_speech'
  | 'speech_to_text';

/**
 * Variable Types for Prompt Templates
 */
export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Variable Definition
 */
export interface VariableDefinition {
  name: string;
  type: VariableType;
  description?: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

/**
 * Prompt Template
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  type: AINodeType;
  systemPrompt: string;
  userPrompt: string;
  variables: VariableDefinition[];
  model: AIModel;
  temperature?: number;
  maxTokens?: number;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Step Node Configuration
 */
export interface AINodeConfig {
  id: string;
  workflowId: string;
  type: AINodeType;
  order: number;
  name: string;
  description?: string;
  model: AIModel;
  systemPrompt?: string;
  userPrompt: string;
  variables: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
  errorHandling: {
    retryCount: number;
    retryDelay: number;
    fallbackMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Execution Context
 */
export interface AIExecutionContext {
  nodeId: string;
  workflowId: string;
  userId: string;
  variables: Record<string, any>;
  previousOutputs?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * AI Execution Result
 */
export interface AIExecutionResult {
  success: boolean;
  nodeId: string;
  output: any;
  modelUsed: AIModel;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  latency: number; // in milliseconds
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Text Generation Options
 */
export interface TextGenerationOptions {
  model: AIModel;
  systemPrompt?: string;
  userPrompt: string;
  variables?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  streaming?: boolean;
}

/**
 * Text Analysis Options
 */
export interface TextAnalysisOptions {
  model: AIModel;
  text: string;
  analysisType: 'sentiment' | 'entities' | 'keywords' | 'summarization' | 'classification';
  language?: string;
  minConfidence?: number;
  maxResults?: number;
}

/**
 * Image Generation Options
 */
export interface ImageGenerationOptions {
  model: AIModel;
  prompt: string;
  style?: 'realistic' | 'artistic' | 'anime' | 'minimalist';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  numberOfImages?: number;
  negativePrompt?: string;
}

/**
 * Cost Calculation Result
 */
export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

/**
 * AI Usage Statistics
 */
export interface AIUsageStats {
  userId: string;
  modelId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Prompt Template Category
 */
export interface PromptTemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  templates: string[]; // template IDs
}

/**
 * AI Node Validation Result
 */
export interface AINodeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Variable Replacement Result
 */
export interface VariableReplacementResult {
  prompt: string;
  replacedVariables: string[];
  missingVariables: string[];
  valid: boolean;
}
