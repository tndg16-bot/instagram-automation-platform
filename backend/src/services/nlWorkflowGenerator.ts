// Natural Language Workflow Generator Service
// Phase A: Natural Language Workflow Generation

import { query } from '../config/database';
import aiNodeService from './aiNodeService';
import {
  ParsedIntent,
  TriggerInfo,
  ConditionInfo,
  ActionInfo,
  Entity,
  GenerationOptions,
  WorkflowGenerationResult,
  WorkflowValidationResult,
  WorkflowValidationError,
  ComparisonOperator,
} from '../types/nlWorkflow';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  WorkflowTrigger,
  TriggerType,
} from '../types/workflow';
import { AIModel, AVAILABLE_MODELS } from '../types/aiNode';

const GPT4_MODEL: AIModel = AVAILABLE_MODELS.openai[0];

/**
 * Natural Language Workflow Generator Service
 * Converts natural language descriptions to executable workflows
 */
class NLWorkflowGenerator {
  private aiService = aiNodeService;

  /**
   * Generate workflow from natural language description
   */
  async generateFromNL(
    description: string,
    options: Partial<GenerationOptions> = {}
  ): Promise<WorkflowGenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Parse natural language
      const parsed = await this.parseDescription(description, options);

      // Step 2: Map to workflow structure
      const workflow = await this.buildWorkflowFromParsed(parsed, options);

      // Step 3: Validate workflow
      const validation = await this.validateWorkflow(workflow);

      // Step 4: Generate alternatives
      const alternatives = await this.generateAlternatives(parsed, options);

      // Step 5: Calculate confidence
      const confidence = this.calculateConfidence(parsed, validation);

      // Step 6: Generate explanation
      const explanation = this.generateExplanation(parsed, workflow);

      return {
        workflow,
        confidence,
        alternatives,
        explanation,
        parsingDetails: {
          parsed,
          validation,
          generationTime: Date.now() - startTime
        },
        success: true
      };
    } catch (error: any) {
      return {
        workflow: null,
        confidence: 0,
        alternatives: [],
        explanation: '',
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Parse natural language description to structured intent
   */
  private async parseDescription(
    description: string,
    options: GenerationOptions
  ): Promise<ParsedIntent> {
    const systemPrompt = `
あなたはInstagram自動化ワークフローの自然言語解析エキスパートです。
ユーザーの記述から、トリガー、条件、アクションを抽出してください。
`;

    const conversationContext = options.conversationContext
      ? `\n\n以前の会話文脈:\n${JSON.stringify(options.conversationContext.summary)}`
      : '';

    const userPrompt = `
以下の記述を解析してください：

"${description}"

${conversationContext}

必要な場合は、ユーザーの言語（${options.language || 'ja'}）を考慮してください。

出力形式（JSON）:
{
  "trigger": {
    "type": "event|schedule|manual",
    "eventType": "comment|dm|follow|mention|like|",
    "schedule": {
      "expression": "...",
      "timezone": "Asia/Tokyo"
    },
    "description": "..."
  },
  "conditions": [
    {
      "id": "cond-1",
      "field": "sentiment|keyword|time|user_type|...",
      "operator": "eq|ne|gt|lt|contains|not_contains|matches|not_matches",
      "value": "...",
      "description": "...",
      "confidence": 0.0-1.0
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "type": "send_dm|reply_comment|like|follow|create_post",
      "params": {...},
      "description": "...",
      "order": 1
    }
  ],
  "extractedEntities": [
    {
      "type": "user|segment|time|content|keyword",
      "value": "...",
      "confidence": 0.0-1.0,
      "startPosition": 0,
      "endPosition": 0
    }
  ],
  "confidence": 0.0-1.0
}
    `.trim();

    const response = await aiNodeService.generateText({
      model: options.aiModel || GPT4_MODEL,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 2000
    });

    return JSON.parse(response.output);
  }

  /**
   * Build workflow structure from parsed intent
   */
  private async buildWorkflowFromParsed(
    parsed: ParsedIntent,
    options: GenerationOptions
  ): Promise<Workflow> {
    const workflowId = `wf-nl-${Date.now()}`;

    // Build nodes
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    // 1. Trigger node
    const triggerNodeId = `trigger-${workflowId}`;
    nodes.push({
      id: triggerNodeId,
      type: 'trigger',
      position: { x: 250, y: 50 },
      config: {
        triggerType: parsed.trigger.type,
        eventType: parsed.trigger.eventType,
        cronExpression: parsed.trigger.schedule?.expression,
        timezone: parsed.trigger.schedule?.timezone
      },
      enabled: true
    });

    // 2. Condition nodes (if any)
    const conditionNodeIds: string[] = [];
    for (const condition of parsed.conditions) {
      const nodeId = `condition-${condition.id}`;
      nodes.push({
        id: nodeId,
        type: 'condition',
        position: { x: 250, y: 200 + (nodes.length * 100) },
        config: {
          logicalOperator: 'AND',
          conditions: [{
            id: condition.id,
            leftOperand: condition.field,
            operator: condition.operator,
            rightOperand: condition.value,
            logicalOperator: 'AND'
          }]
        },
        enabled: true
      });
      conditionNodeIds.push(nodeId);
    }

    // 3. Action nodes
    const actionNodeIds: string[] = [];
    let lastNodeId = triggerNodeId;

    for (const action of parsed.actions) {
      const nodeId = `action-${action.id}`;
      nodes.push({
        id: nodeId,
        type: 'action',
        position: { x: 450, y: 200 + (actionNodeIds.length * 100) },
        config: {
          actionType: action.type,
          instagramAccountId: options.instagramAccountId || 'default',
          recipientId: action.params.recipientId,
          commentId: action.params.commentId,
          mediaId: action.params.mediaId,
          message: action.params.message,
          mediaUrl: action.params.mediaUrl
        },
        enabled: true
      });

      // Create edge
      if (lastNodeId) {
        edges.push({
          id: `edge-${lastNodeId}-${nodeId}`,
          sourceNodeId: lastNodeId,
          targetNodeId: nodeId
        });
      }

      actionNodeIds.push(nodeId);
      lastNodeId = nodeId;
    }

    // 4. Add AI nodes if requested
    if (options.includeAI) {
      const aiNodeId = `ai-${workflowId}`;
      nodes.push({
        id: aiNodeId,
        type: 'ai_text_gen',
        position: { x: 650, y: 200 },
        config: {
          modelId: 'gpt-4',
          systemPrompt: 'You are a professional Instagram content creator. Create engaging captions and posts.',
          userPrompt: 'Generate content based on context',
          variables: { content: '{{previous_output}}' },
          temperature: 0.7,
          maxTokens: 1000,
          outputVariable: 'generated_content'
        },
        enabled: true
      });

      // Connect AI node to last action
      if (lastNodeId) {
        edges.push({
          id: `edge-${lastNodeId}-${aiNodeId}`,
          sourceNodeId: lastNodeId,
          targetNodeId: aiNodeId
        });
      }

      lastNodeId = aiNodeId;
    }

    // 5. End node
    const endNodeId = `end-${workflowId}`;
    nodes.push({
      id: endNodeId,
      type: 'end',
      position: { x: 650, y: 500 },
      config: {
        result: 'success'
      },
      enabled: true
    });

    if (lastNodeId) {
      edges.push({
        id: `edge-${lastNodeId}-${endNodeId}`,
        sourceNodeId: lastNodeId,
        targetNodeId: endNodeId
      });
    }

    return {
      id: workflowId,
      userId: options.userId || 'mock-user-id',
      name: options.workflowName || `Auto-generated: ${parsed.trigger.description}`,
      description: parsed.trigger.description,
      status: 'draft',
      trigger: {
        id: `trigger-${workflowId}`,
        type: parsed.trigger.type,
        config: {
          eventType: parsed.trigger.eventType,
          cronExpression: parsed.trigger.schedule?.expression,
          timezone: parsed.trigger.schedule?.timezone,
          conditions: [],
          instagramAccountId: options.instagramAccountId || 'default'
        },
        enabled: true
      },
      nodes,
      edges,
      variables: [],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get default AI system prompt for action type
   */
  private getDefaultAISystemPrompt(actionType: string): string {
    const prompts: Record<string, string> = {
      'send_dm': 'You are a professional Instagram DM writer. Create engaging and personalized direct messages.',
      'reply_comment': 'You are a professional Instagram comment responder. Create helpful and engaging replies.',
      'create_post': 'You are a professional Instagram content creator. Create engaging captions and posts.',
      'like': 'You are analyzing content for engagement.',
      'follow': 'You are following users based on criteria.'
    };

    return prompts[actionType] || 'You are a helpful AI assistant for Instagram automation.';
  }

  /**
   * Validate workflow structure
   */
  private async validateWorkflow(workflow: Workflow): Promise<WorkflowValidationResult> {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationError[] = [];

    // 1. Check for missing nodes
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.sourceNodeId)) {
        errors.push({
          type: 'missing_node',
          edgeId: edge.id,
          message: `Source node ${edge.sourceNodeId} does not exist`
        });
      }
      if (!nodeIds.has(edge.targetNodeId)) {
        errors.push({
          type: 'missing_node',
          edgeId: edge.id,
          message: `Target node ${edge.targetNodeId} does not exist`
        });
      }
    }

    // 2. Check for orphans
    const connectedNodeIds = new Set([
      ...workflow.edges.map(e => e.sourceNodeId),
      ...workflow.edges.map(e => e.targetNodeId)
    ]);
    for (const node of workflow.nodes) {
      if (node.type !== 'trigger' && !connectedNodeIds.has(node.id)) {
        warnings.push({
          type: 'orphan_node',
          nodeId: node.id,
          message: `Node ${node.id} is not connected to any edge`
        });
      }
    }

    // 3. Check for cycles
    const cycles = this.detectCycles(workflow.nodes, workflow.edges);
    if (cycles.length > 0) {
      errors.push({
        type: 'cycle_detected',
        message: `Workflow contains ${cycles.length} cycles: ${cycles.join(', ')}`
      });
    }

    // 4. Validate node configurations
    for (const node of workflow.nodes) {
      const validation = this.validateNodeConfig(node);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
      warnings.push(...validation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect cycles in workflow
   */
  private detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (nodeId: string, path: string[] = []) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      // Find all outgoing edges
      const outgoing = edges.filter(e => e.sourceNodeId === nodeId);

      for (const edge of outgoing) {
        const neighbor = edge.targetNodeId;

        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path, nodeId]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycle = path.slice(path.indexOf(neighbor));
          cycles.push(cycle.join(' -> '));
        }
      }

      recursionStack.delete(nodeId);
    };

    // Start DFS from trigger node
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (triggerNode) {
      dfs(triggerNode.id);
    }

    return cycles;
  }

  /**
   * Validate node configuration
   */
  private validateNodeConfig(node: WorkflowNode): {
    valid: boolean;
    errors: WorkflowValidationError[];
    warnings: WorkflowValidationError[];
  } {
    const errors: WorkflowValidationError[] = [];
    const warnings: WorkflowValidationError[] = [];

    switch (node.type) {
      case 'ai_text_gen':
        const config = node.config as any;
        if (!config.userPrompt || config.userPrompt.trim() === '') {
          errors.push({
            type: 'invalid_config',
            nodeId: node.id,
            message: 'AI text generation node requires a user prompt'
          });
        }
        if (!config.modelId) {
          errors.push({
            type: 'invalid_config',
            nodeId: node.id,
            message: 'AI text generation node requires a model selection'
          });
        }
        break;

      case 'action':
        const actionConfig = node.config as any;
        if (actionConfig.actionType === 'send_dm' && !actionConfig.message) {
          errors.push({
            type: 'invalid_config',
            nodeId: node.id,
            message: 'Send DM action requires a message'
          });
        }
        break;

      default:
        // Other node types are validated by their own validators
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate alternative workflows
   */
  private async generateAlternatives(
    parsed: ParsedIntent,
    options: GenerationOptions
  ): Promise<Workflow[]> {
    const alternatives: Workflow[] = [];

    // Alternative 1: Different trigger type
    if (parsed.trigger.type === 'event') {
      const altWorkflow = await this.buildWorkflowFromParsed(
        { ...parsed, trigger: { ...parsed.trigger, type: 'schedule' } },
        options
      );
      alternatives.push(altWorkflow);
    }

    // Alternative 2: Different AI model
    if (options.includeAI) {
      const altWorkflow = await this.buildWorkflowFromParsed(parsed, {
        ...options,
        aiModel: { provider: 'anthropic', id: 'claude-3-opus' }
      });
      alternatives.push(altWorkflow);
    }

    // Alternative 3: Simplified version
    const simplifiedConditions = parsed.conditions.slice(0, 1);
    const simplifiedWorkflow = await this.buildWorkflowFromParsed(
      { ...parsed, conditions: simplifiedConditions },
      options
    );
    alternatives.push(simplifiedWorkflow);

    return alternatives;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    parsed: ParsedIntent,
    validation: WorkflowValidationResult
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase if entities were extracted successfully
    if (parsed.extractedEntities.length > 0) {
      confidence += 0.1;
    }

    // Decrease if validation errors found
    if (validation.errors.length > 0) {
      confidence -= validation.errors.length * 0.1;
    }

    // Increase if conditions are well-defined
    const avgConditionConfidence = parsed.conditions.reduce((sum, c) => sum + c.confidence, 0) / parsed.conditions.length;
    if (avgConditionConfidence > 0.8) {
      confidence += 0.05;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Generate explanation for the generated workflow
   */
  private generateExplanation(parsed: ParsedIntent, workflow: Workflow): string {
    const parts: string[] = [];

    parts.push(`トリガー: ${parsed.trigger.description}`);

    if (parsed.conditions.length > 0) {
      parts.push(`条件: ${parsed.conditions.map(c => c.description).join('、')}`);
    }

    if (parsed.actions.length > 0) {
      parts.push(`アクション: ${parsed.actions.map(a => a.description).join(' -> ')}`);
    }

    if (parsed.extractedEntities.length > 0) {
      parts.push(`抽出エンティティ: ${parsed.extractedEntities.map(e => `${e.type}: ${e.value}`).join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Save generated workflow to database
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    const sql = `
      INSERT INTO automation_workflows (
        user_id, name, description, trigger_type, trigger_config,
        steps, start_conditions, end_conditions, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
      RETURNING *
    `;

    await query(sql, [
      workflow.userId,
      workflow.name,
      workflow.description,
      workflow.trigger.type,
      JSON.stringify(workflow.trigger.config),
      JSON.stringify(workflow.nodes),
      JSON.stringify(workflow.trigger.config.conditions),
      null,
      'draft'
    ]);
  }
}

export default new NLWorkflowGenerator();
