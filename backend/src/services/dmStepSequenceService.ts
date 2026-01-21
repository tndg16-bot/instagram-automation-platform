import { query } from '../config/database';
import dmCampaignService from './dmCampaignService';
import InstagramGraphClient from './instagramClient';

interface DMStep {
  id: string;
  campaign_id: string;
  step_order: number;
  message: string;
  media_url?: string;
  delay_hours: number;
  trigger_condition?: any;
  created_at: Date;
}

interface DMStepExecutionResult {
  success: boolean;
  step_order: number;
  next_step_order?: number | null;
  branch_taken?: string;
  error?: string;
}

class DMStepSequenceService {
  async createStep(data: {
    campaign_id: string;
    step_order: number;
    message: string;
    media_url?: string;
    delay_hours?: number;
    trigger_condition?: any;
  }): Promise<DMStep> {
    const result = await query(
      `INSERT INTO dm_step_sequences (campaign_id, step_order, message, media_url, delay_hours, trigger_condition)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.campaign_id,
        data.step_order,
        data.message,
        data.media_url || null,
        data.delay_hours || 0,
        data.trigger_condition ? JSON.stringify(data.trigger_condition) : null,
      ]
    );
    return result.rows[0];
  }

  async getStepsByCampaignId(campaignId: string): Promise<DMStep[]> {
    const result = await query(
      'SELECT * FROM dm_step_sequences WHERE campaign_id = $1 ORDER BY step_order ASC',
      [campaignId]
    );
    return result.rows;
  }

  async updateStep(
    stepId: string,
    data: {
      step_order?: number;
      message?: string;
      media_url?: string;
      delay_hours?: number;
      trigger_condition?: any;
    }
  ): Promise<DMStep> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.step_order !== undefined) {
      updates.push(`step_order = $${paramIndex++}`);
      values.push(data.step_order);
    }
    if (data.message !== undefined) {
      updates.push(`message = $${paramIndex++}`);
      values.push(data.message);
    }
    if (data.media_url !== undefined) {
      updates.push(`media_url = $${paramIndex++}`);
      values.push(data.media_url || null);
    }
    if (data.delay_hours !== undefined) {
      updates.push(`delay_hours = $${paramIndex++}`);
      values.push(data.delay_hours);
    }
    if (data.trigger_condition !== undefined) {
      updates.push(`trigger_condition = $${paramIndex++}`);
      values.push(data.trigger_condition ? JSON.stringify(data.trigger_condition) : null);
    }

    values.push(stepId);
    const queryStr = `UPDATE dm_step_sequences SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    const result = await query(queryStr, values);
    return result.rows[0];
  }

  async deleteStep(stepId: string): Promise<void> {
    await query('DELETE FROM dm_step_sequences WHERE id = $1', [stepId]);
  }

  async deleteStepsByCampaignId(campaignId: string): Promise<void> {
    await query('DELETE FROM dm_step_sequences WHERE campaign_id = $1', [campaignId]);
  }

  evaluateTriggerCondition(condition: any, context: any): boolean {
    if (!condition) {
      return true;
    }

    const { type, field, operator, value } = condition;

    switch (operator) {
      case 'equals':
        return context[field] === value;
      case 'not_equals':
        return context[field] !== value;
      case 'contains':
        return String(context[field]).includes(String(value));
      case 'not_contains':
        return !String(context[field]).includes(String(value));
      case 'greater_than':
        return Number(context[field]) > Number(value);
      case 'less_than':
        return Number(context[field]) < Number(value);
      case 'greater_or_equal':
        return Number(context[field]) >= Number(value);
      case 'less_or_equal':
        return Number(context[field]) <= Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(context[field]);
      case 'not_in':
        return Array.isArray(value) && !value.includes(context[field]);
      case 'regex':
        return new RegExp(value).test(String(context[field]));
      default:
        return true;
    }
  }

  async executeStepSequence(campaignId: string, recipientId: string): Promise<DMStepExecutionResult[]> {
    const steps = await this.getStepsByCampaignId(campaignId);
    const results: DMStepExecutionResult[] = [];
    const context: any = {};

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (step.trigger_condition) {
        const shouldExecute = this.evaluateTriggerCondition(step.trigger_condition, context);

        if (!shouldExecute) {
          results.push({
            success: false,
            step_order: step.step_order,
            next_step_order: this.findNextStep(steps, step.step_order, 'false_branch'),
            branch_taken: 'false_branch',
          });

          const nextStepOrder = this.findNextStep(steps, step.step_order, 'false_branch');

          if (nextStepOrder !== null) {
            i = steps.findIndex(s => s.step_order === nextStepOrder) - 1;
          } else {
            break;
          }

          continue;
        }
      }

      try {
        const campaign = await dmCampaignService.getCampaignById(campaignId);

        if (!campaign) {
          throw new Error('Campaign not found');
        }

        const accessToken = await this.getAccessToken(campaign.instagram_account_id);
        const client = new InstagramGraphClient(accessToken);

        await client.sendDM(recipientId, step.message, step.media_url);

        results.push({
          success: true,
          step_order: step.step_order,
          next_step_order: this.findNextStep(steps, step.step_order, 'default'),
          branch_taken: 'default',
        });

        context.last_response_received_at = new Date();
        context.last_step_executed = step.step_order;

        const nextStep = steps.find(s => s.step_order === this.findNextStep(steps, step.step_order, 'default'));

        if (nextStep && nextStep.delay_hours > 0) {
          await this.delay(nextStep.delay_hours * 60 * 60 * 1000);
        }

      } catch (error: any) {
        results.push({
          success: false,
          step_order: step.step_order,
          next_step_order: this.findNextStep(steps, step.step_order, 'error_branch'),
          branch_taken: 'error_branch',
          error: error.message,
        });

        context.last_error = error.message;

        const errorStepOrder = this.findNextStep(steps, step.step_order, 'error_branch');

        if (errorStepOrder !== null) {
          i = steps.findIndex(s => s.step_order === errorStepOrder) - 1;
        } else {
          break;
        }
      }
    }

    return results;
  }

  findNextStep(steps: DMStep[], currentStepOrder: number, branch: string): number | null {
    const currentStep = steps.find(s => s.step_order === currentStepOrder);

    if (!currentStep || !currentStep.trigger_condition) {
      const nextStep = steps.find(s => s.step_order > currentStepOrder);
      return nextStep ? nextStep.step_order : null;
    }

    const branches = currentStep.trigger_condition.branches || {};
    const branchStepOrder = branches[branch];

    if (!branchStepOrder) {
      return null;
    }

    const targetStep = steps.find(s => s.step_order === branchStepOrder);

    return targetStep ? targetStep.step_order : null;
  }

  async getAccessToken(instagramAccountId: string): Promise<string> {
    const result = await query(
      'SELECT access_token FROM instagram_accounts WHERE id = $1',
      [instagramAccountId]
    );

    if (result.rows.length === 0) {
      throw new Error('Instagram account not found');
    }

    return result.rows[0].access_token;
  }

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new DMStepSequenceService();
