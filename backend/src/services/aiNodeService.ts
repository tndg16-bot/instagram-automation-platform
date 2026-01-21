import {
  AIProvider,
  AIModel,
  TextGenerationOptions,
  TextAnalysisOptions,
  ImageGenerationOptions,
  AIExecutionResult,
  CostCalculation,
  AIUsageStats,
  VariableReplacementResult,
} from '../types/aiNode';

/**
 * AI Node Service for Phase 3
 * Supports multi-model AI generation (OpenAI GPT-4, Anthropic Claude, Google Gemini)
 */
class AINodeService {
  private apiKeys: Map<AIProvider, string>;

  constructor() {
    this.apiKeys = new Map();
    this.initializeAPIKeys();
  }

  private initializeAPIKeys(): void {
    const openaiKey = process.env.OPENAI_API_KEY || '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    const googleKey = process.env.GOOGLE_AI_API_KEY || '';

    if (openaiKey) this.apiKeys.set('openai', openaiKey);
    if (anthropicKey) this.apiKeys.set('anthropic', anthropicKey);
    if (googleKey) this.apiKeys.set('google', googleKey);
  }

  /**
   * Generate text using specified AI model
   */
  async generateText(options: TextGenerationOptions): Promise<AIExecutionResult> {
    const startTime = Date.now();
    const { model, userPrompt, systemPrompt, variables = {}, temperature = 0.7, maxTokens = 1000 } = options;

    // Replace variables in prompts
    const systemPromptResult = this.replaceVariables(systemPrompt || '', variables);
    const userPromptResult = this.replaceVariables(userPrompt, variables);

    if (!systemPromptResult.valid) {
      console.warn('Missing variables in system prompt:', systemPromptResult.missingVariables);
    }
    if (!userPromptResult.valid) {
      console.warn('Missing variables in user prompt:', userPromptResult.missingVariables);
    }

    let result: AIExecutionResult;

    try {
      switch (model.provider) {
        case 'openai':
          result = await this.callOpenAI({
            model,
            systemPrompt: systemPromptResult.prompt,
            userPrompt: userPromptResult.prompt,
            temperature,
            maxTokens,
            streaming: options.streaming || false,
          });
          break;
        case 'anthropic':
          result = await this.callAnthropic({
            model,
            systemPrompt: systemPromptResult.prompt,
            userPrompt: userPromptResult.prompt,
            temperature,
            maxTokens,
            streaming: options.streaming || false,
          });
          break;
        case 'google':
          result = await this.callGoogle({
            model,
            systemPrompt: systemPromptResult.prompt,
            userPrompt: userPromptResult.prompt,
            temperature,
            maxTokens,
            streaming: options.streaming || false,
          });
          break;
        default:
          throw new Error(`Unsupported AI provider: ${model.provider}`);
      }

      result.latency = Date.now() - startTime;
      result.timestamp = new Date();

      return result;
    } catch (error: any) {
      return {
        success: false,
        nodeId: '',
        output: null,
        modelUsed: model,
        tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        latency: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Analyze text using AI
   */
  async analyzeText(options: TextAnalysisOptions): Promise<AIExecutionResult> {
    const { model, text, analysisType } = options;

    const systemPrompt = this.getAnalysisSystemPrompt(analysisType);
    const userPrompt = this.buildAnalysisPrompt(text, analysisType);

    const textGenOptions: TextGenerationOptions = {
      model,
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temperature for analysis
      maxTokens: 1000,
    };

    return this.generateText(textGenOptions);
  }

  /**
   * Generate image using AI (OpenAI DALL-E 3)
   */
  async generateImage(options: ImageGenerationOptions): Promise<AIExecutionResult> {
    const startTime = Date.now();
    const { model, prompt, style = 'realistic', size = '1024x1024', numberOfImages = 1 } = options;

    if (model.provider !== 'openai') {
      throw new Error('Image generation is currently only supported with OpenAI (DALL-E 3)');
    }

    const apiKey = this.apiKeys.get('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const styledPrompt = this.applyImageStyle(prompt, style);

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: styledPrompt,
          n: numberOfImages,
          size: size,
          quality: options.quality || 'standard',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data: any = await response.json();
      const images = data.data.map((item: any) => item.url);

      // Estimate cost for DALL-E 3
      const inputCost = numberOfImages * 0.04; // Standard quality
      const outputCost = 0; // Images are output

      return {
        success: true,
        nodeId: '',
        output: images,
        modelUsed: model,
        tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: inputCost + outputCost,
        latency: Date.now() - startTime,
        timestamp: new Date(),
        metadata: {
          style,
          size,
          numberOfImages,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        nodeId: '',
        output: null,
        modelUsed: model,
        tokensUsed: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        latency: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Calculate cost for AI operation
   */
  calculateCost(model: AIModel, promptTokens: number, completionTokens: number): CostCalculation {
    const inputCostPer1k = model.costPer1kTokens;
    const outputCostPer1k = model.costPer1kTokens * 2; // Output tokens typically cost 2x

    const inputCost = (promptTokens / 1000) * inputCostPer1k;
    const outputCost = (completionTokens / 1000) * outputCostPer1k;

    return {
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      inputCost: Math.round(inputCost * 10000) / 10000,
      outputCost: Math.round(outputCost * 10000) / 10000,
      totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
      currency: 'USD',
    };
  }

  /**
   * Replace variables in prompt
   */
  replaceVariables(prompt: string, variables: Record<string, any>): VariableReplacementResult {
    let replacedPrompt = prompt;
    const replacedVariables: string[] = [];
    const missingVariables: string[] = [];

    const varPattern = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = varPattern.exec(prompt)) !== null) {
      const varName = match[1];
      if (variables[varName] !== undefined) {
        replacedPrompt = replacedPrompt.replace(match[0], String(variables[varName]));
        replacedVariables.push(varName);
      } else {
        missingVariables.push(varName);
      }
    }

    return {
      prompt: replacedPrompt,
      replacedVariables,
      missingVariables,
      valid: missingVariables.length === 0,
    };
  }

  /**
   * Get available models
   */
  getAvailableModels(): AIModel[] {
    const allModels: AIModel[] = [
      ...(AVAILABLE_MODELS.openai || []),
      ...(AVAILABLE_MODELS.anthropic || []),
      ...(AVAILABLE_MODELS.google || []),
    ];

    // Return only models with configured API keys
    return allModels.filter(model => {
      const hasKey = this.apiKeys.has(model.provider);
      if (!hasKey) {
        console.warn(`No API key configured for ${model.provider}, skipping model: ${model.name}`);
      }
      return hasKey;
    });
  }

  /**
   * Validate AI node configuration
   */
  validateNodeConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.model) {
      errors.push('Model is required');
    }

    if (!config.userPrompt || config.userPrompt.trim() === '') {
      errors.push('User prompt is required');
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.maxTokens !== undefined && config.maxTokens <= 0) {
      errors.push('Max tokens must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ========== PRIVATE METHODS ==========

  private async callOpenAI(params: {
    model: AIModel;
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
    streaming: boolean;
  }): Promise<AIExecutionResult> {
    const apiKey = this.apiKeys.get('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: params.model.id,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data: any = await response.json();
    const output = data.choices[0]?.message?.content;

    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    const cost = this.calculateCost(params.model, promptTokens, completionTokens);

    return {
      success: true,
      nodeId: '',
      output,
      modelUsed: params.model,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      cost: cost.totalCost,
      latency: 0, // Set by caller
      timestamp: new Date(),
    };
  }

  private async callAnthropic(params: {
    model: AIModel;
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
    streaming: boolean;
  }): Promise<AIExecutionResult> {
    const apiKey = this.apiKeys.get('anthropic');
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: params.model.id,
        system: params.systemPrompt,
        messages: [
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data: any = await response.json();
    const output = data.content[0]?.text;

    const promptTokens = data.usage?.input_tokens || 0;
    const completionTokens = data.usage?.output_tokens || 0;

    const cost = this.calculateCost(params.model, promptTokens, completionTokens);

    return {
      success: true,
      nodeId: '',
      output,
      modelUsed: params.model,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      cost: cost.totalCost,
      latency: 0,
      timestamp: new Date(),
    };
  }

  private async callGoogle(params: {
    model: AIModel;
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
    streaming: boolean;
  }): Promise<AIExecutionResult> {
    const apiKey = this.apiKeys.get('google');
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${params.model.id}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: params.systemPrompt + '\n\n' + params.userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${error}`);
    }

    const data: any = await response.json();
    const output = data.candidates[0]?.content?.parts[0]?.text || '';

    // Estimate tokens (Gemini doesn't provide exact token counts in all cases)
    const estimatedPromptTokens = Math.ceil((params.systemPrompt.length + params.userPrompt.length) / 4);
    const estimatedCompletionTokens = Math.ceil(output.length / 4);

    const cost = this.calculateCost(params.model, estimatedPromptTokens, estimatedCompletionTokens);

    return {
      success: true,
      nodeId: '',
      output,
      modelUsed: params.model,
      tokensUsed: {
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
      },
      cost: cost.totalCost,
      latency: 0,
      timestamp: new Date(),
      metadata: {
        estimated: true,
      },
    };
  }

  private getAnalysisSystemPrompt(analysisType: string): string {
    const prompts: Record<string, string> = {
      sentiment: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and provide a detailed assessment including sentiment polarity, confidence score, and key emotional indicators.',
      entities: 'You are an entity extraction expert. Identify and extract all named entities (people, organizations, locations, dates, etc.) from the given text.',
      keywords: 'You are a keyword extraction expert. Extract the most important keywords and phrases from the given text.',
      summarization: 'You are a summarization expert. Create a concise and accurate summary of the given text, capturing the main points and key information.',
      classification: 'You are a text classification expert. Classify the given text into appropriate categories and provide confidence scores for each category.',
    };

    return prompts[analysisType] || 'You are an AI assistant helping with text analysis.';
  }

  private buildAnalysisPrompt(text: string, analysisType: string): string {
    return `Analyze the following text for ${analysisType}:\n\n${text}\n\nProvide your analysis in JSON format.`;
  }

  private applyImageStyle(prompt: string, style: string): string {
    const styleModifiers: Record<string, string> = {
      realistic: ', photorealistic, highly detailed, 4K, cinematic lighting',
      artistic: ', artistic, painterly, expressive brushstrokes, vibrant colors',
      anime: ', anime style, manga, cel shading, vibrant, stylized',
      minimalist: ', minimalist, clean lines, simple, elegant, modern',
    };

    const modifier = styleModifiers[style] || '';
    return `${prompt}${modifier}`;
  }
}

// Export constants from types
export const { AVAILABLE_MODELS } = require('../types/aiNode');

export default new AINodeService();
