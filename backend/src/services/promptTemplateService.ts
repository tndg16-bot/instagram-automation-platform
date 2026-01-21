import { query } from '../config/database';
import {
  PromptTemplate,
  VariableDefinition,
  AINodeType,
  PromptTemplateCategory,
  VariableReplacementResult,
} from '../types/aiNode';

/**
 * Prompt Template Management Service
 * Handles prompt templates, variable management, and categorization
 */
class PromptTemplateService {
  /**
   * Create a new prompt template
   */
  async createTemplate(data: {
    userId: string;
    name: string;
    description?: string;
    type: AINodeType;
    systemPrompt: string;
    userPrompt: string;
    variables: VariableDefinition[];
    modelId: string;
    temperature?: number;
    maxTokens?: number;
    isPublic?: boolean;
  }): Promise<PromptTemplate> {
    const result = await query(
      `INSERT INTO prompt_templates (
        user_id, name, description, type, system_prompt, user_prompt,
        variables, model_id, temperature, max_tokens, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.userId,
        data.name,
        data.description || null,
        data.type,
        data.systemPrompt,
        data.userPrompt,
        JSON.stringify(data.variables),
        data.modelId,
        data.temperature || 0.7,
        data.maxTokens || 1000,
        data.isPublic || false,
      ]
    );

    return this.mapRowToTemplate(result.rows[0] as any);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<PromptTemplate | null> {
    const result = await query(
      'SELECT * FROM prompt_templates WHERE id = $1',
      [templateId]
    );

    return result.rows.length > 0 ? this.mapRowToTemplate(result.rows[0]) : null;
  }

  /**
   * Get templates by user
   */
  async getTemplatesByUserId(
    userId: string,
    options: {
      type?: AINodeType;
      includePublic?: boolean;
      category?: string;
    } = {}
  ): Promise<PromptTemplate[]> {
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (options.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(options.type);
    }

    if (!options.includePublic) {
      conditions.push(`is_public = false`);
    }

    const whereClause = conditions.join(' AND ');

    let queryStr = `SELECT * FROM prompt_templates WHERE ${whereClause} ORDER BY created_at DESC`;

    if (options.includePublic) {
      queryStr = `
        SELECT * FROM prompt_templates
        WHERE (user_id = $1 OR is_public = true)
        ${options.type ? `AND type = $${paramIndex++}` : ''}
        ORDER BY created_at DESC
      `;
    }

    const result = await query(queryStr, values);
    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  /**
   * Get public templates
   */
  async getPublicTemplates(options: {
    type?: AINodeType;
    category?: string;
    limit?: number;
  } = {}): Promise<PromptTemplate[]> {
    const conditions: string[] = ['is_public = true'];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(options.type);
    }

    if (options.category) {
      conditions.push(`category = $${paramIndex++}`);
      values.push(options.category);
    }

    const whereClause = conditions.join(' AND ');
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';

    const result = await query(
      `SELECT * FROM prompt_templates WHERE ${whereClause} ORDER BY created_at DESC ${limitClause}`,
      values
    );

    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      systemPrompt?: string;
      userPrompt?: string;
      variables?: VariableDefinition[];
      modelId?: string;
      temperature?: number;
      maxTokens?: number;
      isPublic?: boolean;
    }
  ): Promise<PromptTemplate | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build update query dynamically
    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.systemPrompt !== undefined) {
      updates.push(`system_prompt = $${paramIndex++}`);
      values.push(data.systemPrompt);
    }
    if (data.userPrompt !== undefined) {
      updates.push(`user_prompt = $${paramIndex++}`);
      values.push(data.userPrompt);
    }
    if (data.variables !== undefined) {
      updates.push(`variables = $${paramIndex++}`);
      values.push(JSON.stringify(data.variables));
    }
    if (data.modelId !== undefined) {
      updates.push(`model_id = $${paramIndex++}`);
      values.push(data.modelId);
    }
    if (data.temperature !== undefined) {
      updates.push(`temperature = $${paramIndex++}`);
      values.push(data.temperature);
    }
    if (data.maxTokens !== undefined) {
      updates.push(`max_tokens = $${paramIndex++}`);
      values.push(data.maxTokens);
    }
    if (data.isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(data.isPublic);
    }

    updates.push(`updated_at = NOW()`);

    values.push(templateId);
    values.push(userId);

    const queryStr = `
      UPDATE prompt_templates
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(queryStr, values);

    return result.rows.length > 0 ? this.mapRowToTemplate(result.rows[0]) : null;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM prompt_templates WHERE id = $1 AND user_id = $2',
      [templateId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(
    templateId: string,
    userId: string,
    newName?: string
  ): Promise<PromptTemplate | null> {
    const template = await this.getTemplateById(templateId);

    if (!template) {
      return null;
    }

    return this.createTemplate({
      userId,
      name: newName || `${template.name} (Copy)`,
      description: template.description,
      type: template.type,
      systemPrompt: template.systemPrompt,
      userPrompt: template.userPrompt,
      variables: template.variables,
      modelId: template.model.id,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      isPublic: false,
    });
  }

  /**
   * Search templates
   */
  async searchTemplates(queryString: string, options: {
    userId?: string;
    type?: AINodeType;
    limit?: number;
  } = {}): Promise<PromptTemplate[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options.userId) {
      conditions.push(`(user_id = $${paramIndex++} OR is_public = true)`);
      values.push(options.userId);
    } else {
      conditions.push(`is_public = true`);
    }

    if (options.type) {
      conditions.push(`type = $${paramIndex++}`);
      values.push(options.type);
    }

    const whereClause = conditions.join(' AND ');
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';

    const result = await query(
      `SELECT * FROM prompt_templates
       WHERE ${whereClause}
       AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})
       ORDER BY created_at DESC ${limitClause}`,
      [...values, `%${queryString}%`, `%${queryString}%`]
    );

    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  /**
   * Replace variables in prompt
   */
  replaceVariables(
    prompt: string,
    variables: Record<string, any>
  ): VariableReplacementResult {
    let replacedPrompt = prompt;
    const replacedVariables: string[] = [];
    const missingVariables: string[] = [];

    // Match {{variable}} pattern
    const varPattern = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = varPattern.exec(prompt)) !== null) {
      const varName = match[1];
      const varValue = variables[varName];

      if (varValue !== undefined && varValue !== null) {
        replacedPrompt = replacedPrompt.replace(match[0], String(varValue));
        replacedVariables.push(varName);
      } else {
        missingVariables.push(varName);
      }
    }

    // Match ${variable} pattern (JavaScript template literal style)
    const templatePattern = /\$\{(\w+)\}/g;
    while ((match = templatePattern.exec(replacedPrompt)) !== null) {
      const varName = match[1];
      const varValue = variables[varName];

      if (varValue !== undefined && varValue !== null) {
        replacedPrompt = replacedPrompt.replace(match[0], String(varValue));
        if (!replacedVariables.includes(varName)) {
          replacedVariables.push(varName);
        }
      } else if (!missingVariables.includes(varName)) {
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
   * Validate prompt template
   */
  validateTemplate(data: {
    name: string;
    systemPrompt: string;
    userPrompt: string;
    variables: VariableDefinition[];
  }): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!data.userPrompt || data.userPrompt.trim().length === 0) {
      errors.push('User prompt is required');
    }

    // Variable validation
    const varPattern = /\{\{(\w+)\}\}/g;
    const usedVars = new Set<string>();
    let match;

    // Extract variables from prompts
    const combinedPrompt = `${data.systemPrompt} ${data.userPrompt}`;
    while ((match = varPattern.exec(combinedPrompt)) !== null) {
      usedVars.add(match[1]);
    }

    const definedVars = new Set(data.variables.map(v => v.name));

    // Check for missing variable definitions
    usedVars.forEach(varName => {
      if (!definedVars.has(varName)) {
        warnings.push(`Variable "{{${varName}}}" is used in prompt but not defined`);
      }
    });

    // Check for unused variable definitions
    definedVars.forEach(varName => {
      if (!usedVars.has(varName)) {
        warnings.push(`Variable "${varName}" is defined but not used in prompt`);
      }
    });

    // Check required variables
    data.variables.forEach(variable => {
      if (variable.required && !usedVars.has(variable.name)) {
        errors.push(`Required variable "${variable.name}" is defined but not used in prompt`);
      }

      // Validate variable type
      const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
      if (!validTypes.includes(variable.type)) {
        errors.push(`Invalid variable type "${variable.type}" for variable "${variable.name}"`);
      }

      // Validate default value type
      if (variable.defaultValue !== undefined && variable.defaultValue !== null) {
        const defaultValueType = typeof variable.defaultValue;
        // Map JS types to our variable types
        const typeMap: Record<string, string> = {
          string: 'string',
          number: 'number',
          boolean: 'boolean',
          object: 'object',
        };

        if (variable.type === 'array' && !Array.isArray(variable.defaultValue)) {
          errors.push(`Default value for variable "${variable.name}" must be an array`);
        } else if (variable.type !== 'array' && typeMap[defaultValueType] !== variable.type) {
          errors.push(`Default value type mismatch for variable "${variable.name}"`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create category
   */
  async createCategory(data: {
    userId: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<PromptTemplateCategory> {
    const result = await query(
      `INSERT INTO prompt_template_categories (user_id, name, description, icon, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.userId,
        data.name,
        data.description || null,
        data.icon || null,
        data.color || null,
      ]
    );

    return this.mapRowToCategory(result.rows[0]);
  }

  /**
   * Get categories by user
   */
  async getCategoriesByUserId(userId: string): Promise<PromptTemplateCategory[]> {
    const result = await query(
      'SELECT * FROM prompt_template_categories WHERE user_id = $1 ORDER BY name',
      [userId]
    );

    return result.rows.map((row: any) => this.mapRowToCategory(row));
  }

  /**
   * Assign template to category
   */
  async assignToCategory(templateId: string, categoryId: string): Promise<boolean> {
    const result = await query(
      `UPDATE prompt_templates SET category_id = $1 WHERE id = $2`,
      [categoryId, templateId]
    );

    return (result.rowCount || 0) > 0;
  }

  // ========== PRIVATE METHODS ==========

  private mapRowToTemplate(row: { [key: string]: any }): PromptTemplate {
    const model = this.getModelById(row.model_id);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      systemPrompt: row.system_prompt,
      userPrompt: row.user_prompt,
      variables: JSON.parse(row.variables || '[]'),
      model: model,
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      userId: row.user_id,
      isPublic: row.is_public,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToCategory(row: any): PromptTemplateCategory {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      templates: [], // Load templates separately
    };
  }

  private getModelById(modelId: string): any {
    // Import and find model from AVAILABLE_MODELS
    // This is a simplified version - in production, load from database
    return {
      id: modelId,
      provider: 'openai',
      name: modelId,
      maxTokens: 4096,
      supportsStreaming: true,
      costPer1kTokens: 0.01,
    };
  }
}

export default new PromptTemplateService();
