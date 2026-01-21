import dmStepSequenceService from '../../services/dmStepSequenceService';
import dmCampaignService from '../../services/dmCampaignService';
import InstagramGraphClient from '../../services/instagramClient';

// Mock dependencies
jest.mock('../../services/dmCampaignService');
jest.mock('../../services/instagramClient');
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const { query } = require('../../config/database');

describe('DMStepSequenceService Integration Tests', () => {
  const mockCampaign = {
    id: 'campaign-1',
    user_id: 'user-1',
    instagram_account_id: 'ig-account-1',
    name: 'Test Campaign',
    message: 'Test message',
    status: 'draft',
    sent_count: 0,
    failed_count: 0,
    delivered_count: 0,
    read_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createStep', () => {
    it('should create a step successfully', async () => {
      const stepData = {
        campaign_id: 'campaign-1',
        step_order: 1,
        message: 'First message',
        media_url: null,
        delay_hours: 0,
        trigger_condition: null,
      };

      const mockStep = {
        id: 'step-1',
        ...stepData,
        trigger_condition: null,
        created_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockStep] });

      const result = await dmStepSequenceService.createStep(stepData);

      expect(result).toEqual(mockStep);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dm_step_sequences'),
        expect.arrayContaining([
          'campaign-1',
          1,
          'First message',
          null,
          0,
          null,
        ])
      );
    });

    it('should create step with trigger condition', async () => {
      const triggerCondition = {
        type: 'response_received',
        field: 'keyword',
        operator: 'equals',
        value: 'yes',
        branches: {
          default: 2,
          false_branch: 3,
          error_branch: 4,
        },
      };

      const stepData = {
        campaign_id: 'campaign-1',
        step_order: 1,
        message: 'Question message',
        trigger_condition: triggerCondition,
      };

      const mockStep = {
        id: 'step-1',
        ...stepData,
        delay_hours: 0,
        media_url: null,
        trigger_condition: JSON.stringify(triggerCondition),
        created_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockStep] });

      const result = await dmStepSequenceService.createStep(stepData);

      expect(result.trigger_condition).toBe(JSON.stringify(triggerCondition));
    });

    it('should use default delay_hours when not provided', async () => {
      const stepData = {
        campaign_id: 'campaign-1',
        step_order: 1,
        message: 'Message',
      };

      const mockStep = {
        id: 'step-1',
        ...stepData,
        delay_hours: 0,
        media_url: null,
        trigger_condition: null,
        created_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockStep] });

      const result = await dmStepSequenceService.createStep(stepData);

      expect(result.delay_hours).toBe(0);
    });
  });

  describe('getStepsByCampaignId', () => {
    it('should retrieve all steps ordered by step_order', async () => {
      const mockSteps = [
        {
          id: 'step-1',
          campaign_id: 'campaign-1',
          step_order: 1,
          message: 'First step',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
        {
          id: 'step-2',
          campaign_id: 'campaign-1',
          step_order: 2,
          message: 'Second step',
          delay_hours: 24,
          trigger_condition: null,
          created_at: new Date(),
        },
      ];

      (query as jest.Mock).mockResolvedValue({ rows: mockSteps });

      const result = await dmStepSequenceService.getStepsByCampaignId('campaign-1');

      expect(result).toHaveLength(2);
      expect(result[0].step_order).toBe(1);
      expect(result[1].step_order).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY step_order ASC'),
        ['campaign-1']
      );
    });

    it('should return empty array for campaign with no steps', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await dmStepSequenceService.getStepsByCampaignId('campaign-1');

      expect(result).toEqual([]);
    });
  });

  describe('updateStep', () => {
    it('should update step message', async () => {
      const mockStep = {
        id: 'step-1',
        campaign_id: 'campaign-1',
        step_order: 1,
        message: 'Updated message',
        delay_hours: 0,
        trigger_condition: null,
        created_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockStep] });

      const result = await dmStepSequenceService.updateStep('step-1', {
        message: 'Updated message',
      });

      expect(result.message).toBe('Updated message');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_step_sequences SET'),
        expect.arrayContaining(['Updated message', 'step-1'])
      );
    });

    it('should update multiple fields', async () => {
      const mockStep = {
        id: 'step-1',
        campaign_id: 'campaign-1',
        step_order: 2,
        message: 'New message',
        delay_hours: 48,
        trigger_condition: null,
        created_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockStep] });

      const result = await dmStepSequenceService.updateStep('step-1', {
        step_order: 2,
        message: 'New message',
        delay_hours: 48,
      });

      expect(result.step_order).toBe(2);
      expect(result.message).toBe('New message');
      expect(result.delay_hours).toBe(48);
    });

    it('should update trigger condition', async () => {
      const newCondition = {
        type: 'response_received',
        field: 'keyword',
        operator: 'contains',
        value: 'test',
      };

      const mockStep = {
        id: 'step-1',
        campaign_id: 'campaign-1',
        step_order: 1,
        message: 'Message',
        delay_hours: 0,
        trigger_condition: JSON.stringify(newCondition),
        created_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockStep] });

      const result = await dmStepSequenceService.updateStep('step-1', {
        trigger_condition: newCondition,
      });

      expect(result.trigger_condition).toBe(JSON.stringify(newCondition));
    });
  });

  describe('deleteStep', () => {
    it('should delete step successfully', async () => {
      (query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      await dmStepSequenceService.deleteStep('step-1');

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM dm_step_sequences WHERE id = $1',
        ['step-1']
      );
    });
  });

  describe('deleteStepsByCampaignId', () => {
    it('should delete all steps for a campaign', async () => {
      (query as jest.Mock).mockResolvedValue({ rowCount: 3 });

      await dmStepSequenceService.deleteStepsByCampaignId('campaign-1');

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM dm_step_sequences WHERE campaign_id = $1',
        ['campaign-1']
      );
    });
  });

  describe('evaluateTriggerCondition', () => {
    it('should return true when no condition', () => {
      const result = dmStepSequenceService.evaluateTriggerCondition(null, {});

      expect(result).toBe(true);
    });

    describe('equals operator', () => {
      it('should return true when values are equal', () => {
        const condition = { type: 'response', field: 'keyword', operator: 'equals', value: 'yes' };
        const context = { keyword: 'yes' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(true);
      });

      it('should return false when values are not equal', () => {
        const condition = { type: 'response', field: 'keyword', operator: 'equals', value: 'yes' };
        const context = { keyword: 'no' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should return true when field contains value', () => {
        const condition = {
          type: 'response',
          field: 'message',
          operator: 'contains',
          value: 'discount',
        };
        const context = { message: 'Get a 20% discount now' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(true);
      });

      it('should return false when field does not contain value', () => {
        const condition = {
          type: 'response',
          field: 'message',
          operator: 'contains',
          value: 'free',
        };
        const context = { message: 'Get a 20% discount now' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(false);
      });
    });

    describe('greater_than operator', () => {
      it('should return true when field is greater', () => {
        const condition = {
          type: 'response',
          field: 'followers',
          operator: 'greater_than',
          value: 1000,
        };
        const context = { followers: 1500 };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(true);
      });

      it('should return false when field is not greater', () => {
        const condition = {
          type: 'response',
          field: 'followers',
          operator: 'greater_than',
          value: 1000,
        };
        const context = { followers: 800 };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(false);
      });
    });

    describe('in operator', () => {
      it('should return true when field is in array', () => {
        const condition = {
          type: 'response',
          field: 'interest',
          operator: 'in',
          value: ['tech', 'science', 'art'],
        };
        const context = { interest: 'tech' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(true);
      });

      it('should return false when field is not in array', () => {
        const condition = {
          type: 'response',
          field: 'interest',
          operator: 'in',
          value: ['tech', 'science', 'art'],
        };
        const context = { interest: 'sports' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(false);
      });
    });

    describe('regex operator', () => {
      it('should return true when regex matches', () => {
        const condition = {
          type: 'response',
          field: 'email',
          operator: 'regex',
          value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        };
        const context = { email: 'test@example.com' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(true);
      });

      it('should return false when regex does not match', () => {
        const condition = {
          type: 'response',
          field: 'email',
          operator: 'regex',
          value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        };
        const context = { email: 'invalid-email' };

        const result = dmStepSequenceService.evaluateTriggerCondition(condition, context);

        expect(result).toBe(false);
      });
    });
  });

  describe('executeStepSequence', () => {
    it('should execute simple sequence without conditions', async () => {
      const mockSteps = [
        {
          id: 'step-1',
          campaign_id: 'campaign-1',
          step_order: 1,
          message: 'Message 1',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
        {
          id: 'step-2',
          campaign_id: 'campaign-1',
          step_order: 2,
          message: 'Message 2',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (query as jest.Mock).mockResolvedValue({ rows: [{ access_token: 'test-token' }] });
      (query as jest.Mock).mockResolvedValue({ rows: mockSteps });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      const result = await dmStepSequenceService.executeStepSequence('campaign-1', 'recipient-1');

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(true);
      expect(mockSendDM).toHaveBeenCalledTimes(2);
    });

    it('should follow false_branch when condition is not met', async () => {
      const mockSteps = [
        {
          id: 'step-1',
          campaign_id: 'campaign-1',
          step_order: 1,
          message: 'Do you want to proceed?',
          delay_hours: 0,
          trigger_condition: {
            type: 'response',
            field: 'keyword',
            operator: 'equals',
            value: 'yes',
            branches: { default: 2, false_branch: 3, error_branch: null },
          },
          created_at: new Date(),
        },
        {
          id: 'step-3',
          campaign_id: 'campaign-1',
          step_order: 3,
          message: 'Maybe next time',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (query as jest.Mock).mockResolvedValue({ rows: [{ access_token: 'test-token' }] });
      (query as jest.Mock).mockResolvedValue({ rows: mockSteps });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      const result = await dmStepSequenceService.executeStepSequence('campaign-1', 'recipient-1');

      expect(result[0].success).toBe(false);
      expect(result[0].branch_taken).toBe('false_branch');
      expect(result[0].next_step_order).toBe(3);
    });

    it('should handle send errors and follow error_branch', async () => {
      const mockSteps = [
        {
          id: 'step-1',
          campaign_id: 'campaign-1',
          step_order: 1,
          message: 'Test message',
          delay_hours: 0,
          trigger_condition: {
            type: 'response',
            branches: { default: 2, false_branch: null, error_branch: 3 },
          },
          created_at: new Date(),
        },
        {
          id: 'step-3',
          campaign_id: 'campaign-1',
          step_order: 3,
          message: 'Error occurred message',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (query as jest.Mock).mockResolvedValue({ rows: [{ access_token: 'test-token' }] });
      (query as jest.Mock).mockResolvedValue({ rows: mockSteps });

      const mockSendDM = jest.fn().mockRejectedValue(new Error('API error'));
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      const result = await dmStepSequenceService.executeStepSequence('campaign-1', 'recipient-1');

      expect(result[0].success).toBe(false);
      expect(result[0].error).toBe('API error');
      expect(result[0].branch_taken).toBe('error_branch');
    });

    it('should stop execution when no next step', async () => {
      const mockSteps = [
        {
          id: 'step-1',
          campaign_id: 'campaign-1',
          step_order: 1,
          message: 'Final message',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (query as jest.Mock).mockResolvedValue({ rows: [{ access_token: 'test-token' }] });
      (query as jest.Mock).mockResolvedValue({ rows: mockSteps });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      const result = await dmStepSequenceService.executeStepSequence('campaign-1', 'recipient-1');

      expect(result).toHaveLength(1);
      expect(result[0].next_step_order).toBeNull();
    });

    it('should throw error when campaign not found', async () => {
      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(null);

      await expect(
        dmStepSequenceService.executeStepSequence('campaign-1', 'recipient-1')
      ).rejects.toThrow('Campaign not found');
    });

    it('should update context after each step', async () => {
      const mockSteps = [
        {
          id: 'step-1',
          campaign_id: 'campaign-1',
          step_order: 1,
          message: 'Message 1',
          delay_hours: 0,
          trigger_condition: null,
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (query as jest.Mock).mockResolvedValue({ rows: [{ access_token: 'test-token' }] });
      (query as jest.Mock).mockResolvedValue({ rows: mockSteps });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      const result = await dmStepSequenceService.executeStepSequence('campaign-1', 'recipient-1');

      expect(result[0].success).toBe(true);
      expect(mockSendDM).toHaveBeenCalled();
    });
  });

  describe('findNextStep', () => {
    it('should return next sequential step when no condition', () => {
      const steps = [
        { id: 'step-1', step_order: 1, trigger_condition: null },
        { id: 'step-2', step_order: 2, trigger_condition: null },
      ];

      const nextStep = (dmStepSequenceService as any).findNextStep(steps, 1, 'default');

      expect(nextStep).toBe(2);
    });

    it('should return null when no next step', () => {
      const steps = [{ id: 'step-1', step_order: 1, trigger_condition: null }];

      const nextStep = (dmStepSequenceService as any).findNextStep(steps, 1, 'default');

      expect(nextStep).toBeNull();
    });

    it('should follow branch from trigger condition', () => {
      const steps = [
        {
          id: 'step-1',
          step_order: 1,
          trigger_condition: {
            branches: { default: 2, false_branch: 3 },
          },
        },
        { id: 'step-3', step_order: 3, trigger_condition: null },
      ];

      const nextStep = (dmStepSequenceService as any).findNextStep(steps, 1, 'false_branch');

      expect(nextStep).toBe(3);
    });

    it('should return null when branch step does not exist', () => {
      const steps = [
        {
          id: 'step-1',
          step_order: 1,
          trigger_condition: {
            branches: { default: 99 },
          },
        },
      ];

      const nextStep = (dmStepSequenceService as any).findNextStep(steps, 1, 'default');

      expect(nextStep).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should retrieve access token successfully', async () => {
      (query as jest.Mock).mockResolvedValue({
        rows: [{ access_token: 'test-access-token' }],
      });

      const result = await (dmStepSequenceService as any).getAccessToken('ig-account-1');

      expect(result).toBe('test-access-token');
    });

    it('should throw error when account not found', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(
        (dmStepSequenceService as any).getAccessToken('non-existent-account')
      ).rejects.toThrow('Instagram account not found');
    });
  });
});
