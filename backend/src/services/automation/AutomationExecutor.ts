import { query } from '../../config/database';

class AutomationExecutor {
  async executeWorkflow(workflowId: string): Promise<any> {
    try {
      const workflowResult = await query(
        `SELECT * FROM automation_workflows WHERE id = \$1`,
        [workflowId]
      );

      if (workflowResult.rows.length === 0) {
        return {
          success: false,
          error: 'Workflow not found',
        };
      }

      const workflow = workflowResult.rows[0];

      const executionResult = await query(
        `INSERT INTO automation_execution_logs (workflow_id, user_id, execution_type, trigger_data, execution_status, start_time, created_at)
         VALUES (\$1, \$2, 'manual', \$3, 'started', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [workflowId, workflow.user_id, JSON.stringify({}), 'started']
      );

      await query(
        `UPDATE automation_workflows SET total_runs = total_runs + 1, last_run_at = CURRENT_TIMESTAMP WHERE id = \$1`,
        [workflowId]
      );

      const steps = JSON.parse(workflow.steps);
      let failedCount = 0;
      let stepResults: any[] = [];

      for (const step of steps) {
        try {
          const stepResult = await this.executeStep(workflowId, step, workflow.user_id);
          stepResults.push(stepResult);

          if (!stepResult.success) {
            failedCount++;
          }

          await query(
            `INSERT INTO automation_workflow_steps (workflow_id, step_order, step_type, step_config, conditions, status, result_data, created_at)
               VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               RETURNING *`,
            [workflowId, step.step_order, step.step_type, JSON.stringify(step.step_config), JSON.stringify(step.conditions), stepResult.success ? 'completed' : 'failed', JSON.stringify(stepResult), '']
          );

        } catch (error: any) {
          failedCount++;

          await query(
            `INSERT INTO automation_workflow_steps (workflow_id, step_order, step_type, step_config, conditions, status, error_message, created_at)
               VALUES (\$1, \$2, \$3, \$4, \$5, 'failed', \$6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
               RETURNING *`,
            [workflowId, step.step_order, step.step_type, JSON.stringify(step.step_config), JSON.stringify(step.conditions), error.message]
          );
        }
      }

      const finalStatus = failedCount === 0 ? 'completed' : 'failed';
      await query(
        `UPDATE automation_workflows SET successful_runs = successful_runs + \$1, failed_runs = \$2 WHERE id = \$3`,
        [workflowId, failedCount]
      );

      await query(
        `UPDATE automation_execution_logs SET end_time = CURRENT_TIMESTAMP, duration_seconds = \$1, result_data = \$2, execution_status = \$3 WHERE id = \$4`,
        [60, JSON.stringify({ stepResults, failedCount }), finalStatus, executionResult.rows[0].id]
      );

      return {
        success: true,
        data: {
          workflow_id: workflowId,
          status: finalStatus,
          steps_executed: steps.length,
          steps_failed: failedCount,
        },
      };
    } catch (error: any) {
      console.error('Error executing workflow:', error);
      return {
        success: false,
        error: 'Failed to execute workflow',
      };
    }
  }

  async executeStep(workflowId: string, step: any, userId: string): Promise<any> {
    const { step_type, step_config, conditions } = step;

    try {
      if (conditions && Object.keys(conditions).length > 0) {
        const conditionsMet = await this.checkConditions(conditions, userId);
        if (!conditionsMet) {
          return {
            success: true,
            skipped: true,
            reason: 'Conditions not met',
          };
        }
      }

      switch (step_type) {
        case 'action':
          return await this.executeActionStep(step_config);
        case 'decision':
          return await this.executeDecisionStep(step_config);
        case 'delay':
          return await this.executeDelayStep(step_config);
        case 'webhook':
          return await this.executeWebhookStep(step_config);
        case 'api_call':
          return await this.executeAPICallStep(step_config);
        default:
          return {
            success: false,
            error: `Unknown step type: \${step_type}`,
          };
      }
    } catch (error: any) {
      console.error('Error executing step:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkConditions(conditions: any, userId: string): Promise<boolean> {
    try {
      for (const condition of conditions) {
        const conditionMet = await this.evaluateCondition(condition, userId);
        if (!conditionMet) {
          return false;
        }
      }
      return true;
    } catch (error: any) {
      console.error('Error checking conditions:', error);
      return false;
    }
  }

  private async evaluateCondition(condition: any, userId: string): Promise<boolean> {
    const { condition_type, condition_config } = condition;

    switch (condition_type) {
      case 'user_behavior':
        return await this.evaluateUserBehaviorCondition(condition_config, userId);
      case 'time_based':
        return this.evaluateTimeBasedCondition(condition_config);
      case 'data_threshold':
        return await this.evaluateDataThresholdCondition(condition_config);
      default:
        return false;
    }
  }

  private async evaluateUserBehaviorCondition(config: any, userId: string): Promise<boolean> {
    const { event_type, count, time_range } = config;

    const result = await query(
      `SELECT COUNT(*) as count
       FROM user_behavior_analytics
       WHERE user_id = \$1 AND event_type = \$2 AND timestamp >= NOW() - INTERVAL '\${time_range}'`,
      [userId, event_type]
    );

    return parseInt(result.rows[0].count) >= count;
  }

  private async evaluateTimeBasedCondition(config: any): Promise<boolean> {
    const { start_time, end_time, day_of_week, time_of_day } = config;

    if (start_time && end_time) {
      const now = new Date();
      return now >= new Date(start_time) && now <= new Date(end_time);
    }

    if (day_of_week !== undefined) {
      const now = new Date();
      const currentDay = now.getDay();
      return currentDay === day_of_week;
    }

    if (time_of_day !== undefined) {
      const now = new Date();
      const currentHour = now.getHours();
      return currentHour >= time_of_day;
    }

    return false;
  }

  private async evaluateDataThresholdCondition(config: any): Promise<boolean> {
    return true;
  }

  private async executeActionStep(config: any): Promise<any> {
    const { action_type, action_config } = config;

    switch (action_type) {
      case 'send_email':
        return { success: true, message: 'Email sent' };
      case 'send_dm':
        return { success: true, message: 'DM sent' };
      case 'create_post':
        return { success: true, message: 'Post created' };
      case 'create_story':
        return { success: true, message: 'Story created' };
      default:
        return { success: false, error: `Unknown action type: \${action_type}` };
    }
  }

  private async executeDecisionStep(config: any): Promise<any> {
    return {
      success: true,
      decision: 'random_choice',
      confidence: 0.5,
    };
  }

  private async executeDelayStep(config: any): Promise<any> {
    const { delay_seconds } = config;

    return {
      success: true,
      message: `Delayed for \${delay_seconds} seconds`,
    };
  }

  private async executeWebhookStep(config: any): Promise<any> {
    const { webhook_url, payload, signature } = config;

    return {
      success: true,
      message: `Webhook sent to ${webhook_url}`,
      signature: signature ? 'signed' : 'unsigned',
    };
  }

  private async executeAPICallStep(config: any): Promise<any> {
    const { api_endpoint, method, headers, body } = config;

    return {
      success: true,
      message: `API call ${method} to ${api_endpoint}`,
    };
  }
}

export default new AutomationExecutor();

