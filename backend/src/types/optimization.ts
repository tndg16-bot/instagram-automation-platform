// Workflow Optimization Types
// Phase E: Workflow Auto-Optimization

/**
 * Workflow Optimization
 */
export interface WorkflowOptimization {
  workflowId: string;
  originalMetrics: WorkflowMetrics;
  proposedChanges: ProposedChange[];
  expectedImprovement: {
    efficiency: number;
    successRate: number;
    cost: number;
  };
  confidence: number;
}

/**
 * Proposed Change
 */
export interface ProposedChange {
  nodeId: string;
  changeType: 'add' | 'remove' | 'modify' | 'reorder';
  description: string;
  reason: string;
  newConfig?: any;
  expectedImpact?: {
    timeSaved: number;
    costReduction: number;
    successIncrease: number;
  };
}

/**
 * Workflow Metrics
 */
export interface WorkflowMetrics {
  totalRuns: number;
  successRate: number;
  averageExecutionTime: number;
  averageCost: number;
  nodeMetrics: Record<string, NodeMetrics>;
  bottlenecks: string[];
  errorRate: number;
}

/**
 * Node Metrics
 */
export interface NodeMetrics {
  nodeId: string;
  avgExecutionTime: number;
  successRate: number;
  errorRate: number;
  executionCount: number;
}

/**
 * A/B Test Configuration
 */
export interface ABTestConfig {
  optimizationId: string;
  testId: string;
  variants: ABTestVariant[];
  testName: string;
  durationDays: number;
  targetMetric: string;
}

/**
 * A/B Test Variant
 */
export interface ABTestVariant {
  id: string;
  nodeId: string;
  config: any;
  description: string;
  isActive: boolean;
}

/**
 * A/B Test Result
 */
export interface ABTestResult {
  testId: string;
  variantId: string;
  metrics: {
    executionCount: number;
    successCount: number;
    avgExecutionTime: number;
    avgCost: number;
    engagementScore: number;
  };
  isWinner: boolean;
  confidence: number;
  significance: number;
  startDate: Date;
  endDate: Date;
}

/**
 * Bottleneck Detection Result
 */
export interface BottleneckDetection {
  workflowId: string;
  bottlenecks: Bottleneck[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

/**
 * Bottleneck
 */
export interface Bottleneck {
  nodeId: string;
  nodeType: string;
  issue: 'slow_execution' | 'high_error_rate' | 'dependency_bottleneck' | 'complex_logic';
  impact: {
    timeIncrease: number; // seconds
    errorIncrease: number; // percentage
    costIncrease: number; // USD
  };
  suggestedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Cost Optimization
 */
export interface CostOptimization {
  workflowId: string;
  currentCost: {
    daily: number;
    monthly: number;
  };
  optimizedCost: {
    daily: number;
    monthly: number;
  };
  savings: {
    daily: number;
    monthly: number;
    yearly: number;
  };
  suggestions: CostSuggestion[];
}

/**
 * Cost Suggestion
 */
export interface CostSuggestion {
  nodeId: string;
  type: 'model_selection' | 'token_reduction' | 'caching' | 'batching';
  description: string;
  estimatedSavings: number; // USD
  implementationEffort: 'easy' | 'medium' | 'hard';
}

// Import workflow types
import { WorkflowMetrics as BaseWorkflowMetrics } from './workflow';
