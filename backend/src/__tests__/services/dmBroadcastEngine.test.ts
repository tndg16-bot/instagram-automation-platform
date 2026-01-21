import dmBroadcastEngine from '../../services/dmBroadcastEngine';
import dmCampaignService from '../../services/dmCampaignService';
import InstagramGraphClient from '../../services/instagramClient';
import { createMockUser, createMockInstagramAccount, sleep } from '../utils/testHelpers';

// Mock dependencies
jest.mock('../../services/dmCampaignService');
jest.mock('../../services/instagramClient');
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const { query } = require('../../config/database');

describe('DMBroadcastEngine Integration Tests', () => {
  const mockUser = createMockUser({ id: 'user-1' });
  const mockInstagramAccount = createMockInstagramAccount({ id: 'ig-account-1' });
  const mockCampaign = {
    id: 'campaign-1',
    user_id: mockUser.id,
    instagram_account_id: mockInstagramAccount.id,
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

  describe('executeCampaign', () => {
    it('should execute campaign successfully with all recipients', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
        {
          id: 'recipient-2',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-2',
          recipient_username: 'user2',
          status: 'pending',
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      await dmBroadcastEngine.executeCampaign('campaign-1');

      expect(dmCampaignService.getCampaignById).toHaveBeenCalledWith('campaign-1');
      expect(dmCampaignService.updateCampaignStatus).toHaveBeenCalledWith('campaign-1', 'sending');
      expect(dmCampaignService.getCampaignRecipients).toHaveBeenCalledWith('campaign-1');
      expect(dmCampaignService.updateCampaignStats).toHaveBeenCalledWith('campaign-1', { total_recipients: 2 });
      expect(mockSendDM).toHaveBeenCalledTimes(2);
      expect(dmCampaignService.updateRecipientStatus).toHaveBeenCalledTimes(2);
    });

    it('should fail if campaign is already executing', async () => {
      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);

      await dmBroadcastEngine.executeCampaign('campaign-1');

      try {
        await dmBroadcastEngine.executeCampaign('campaign-1');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Campaign is already being executed');
      }
    });

    it('should fail if campaign not found', async () => {
      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(null);

      await expect(dmBroadcastEngine.executeCampaign('non-existent-campaign')).rejects.toThrow('Campaign not found');
    });

    it('should fail if campaign is not in valid state', async () => {
      const activeCampaign = { ...mockCampaign, status: 'sending' as const };
      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(activeCampaign);

      await expect(dmBroadcastEngine.executeCampaign('campaign-1')).rejects.toThrow(
        'Campaign is not in a valid state for execution'
      );
    });

    it('should handle recipient send failures', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const mockSendDM = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      await dmBroadcastEngine.executeCampaign('campaign-1');

      expect(dmCampaignService.updateRecipientStatus).toHaveBeenCalledWith(
        'recipient-1',
        'failed',
        'Rate limit exceeded'
      );
      expect(dmCampaignService.updateCampaignStats).toHaveBeenCalledWith('campaign-1', { failed_count: 1 });
    });

    it('should set timestamps correctly', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      await dmBroadcastEngine.executeCampaign('campaign-1');

      expect(query).toHaveBeenCalledWith(expect.stringContaining('started_at = NOW()'), ['campaign-1']);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('completed_at = NOW()'), ['campaign-1']);
    });

    it('should remove campaign from active set after completion', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      await dmBroadcastEngine.executeCampaign('campaign-1');

      try {
        await dmBroadcastEngine.executeCampaign('campaign-1');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBe('Campaign is already being executed');
      }
    });
  });

  describe('checkRateLimit', () => {
    it('should initialize rate limit on first request', async () => {
      (query as jest.Mock).mockResolvedValue({
        rows: [{ access_token: 'test-token' }],
      });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue([
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
      ]);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);

      await dmBroadcastEngine.executeCampaign('campaign-1');

      expect(mockSendDM).toHaveBeenCalledTimes(1);
    });

    it('should wait when rate limit is exceeded', async () => {
      (query as jest.Mock).mockResolvedValue({
        rows: [{ access_token: 'test-token' }],
      });

      const mockSendDM = jest.fn().mockResolvedValue({ success: true });
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue([
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
      ]);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);

      await dmBroadcastEngine.executeCampaign('campaign-1');

      expect(mockSendDM).toHaveBeenCalled();
    });
  });

  describe('checkScheduledCampaigns', () => {
    it('should find and execute campaigns scheduled for now', async () => {
      const now = new Date();
      const scheduledCampaign = {
        ...mockCampaign,
        status: 'scheduled' as const,
        scheduled_at: now,
      };

      (query as jest.Mock).mockResolvedValue({ rows: [scheduledCampaign] });
      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(scheduledCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue([]);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);

      await dmBroadcastEngine.checkScheduledCampaigns();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status ='),
        expect.any(Array)
      );
    });

    it('should skip campaigns already being executed', async () => {
      const now = new Date();
      const scheduledCampaign = {
        ...mockCampaign,
        status: 'scheduled' as const,
        scheduled_at: now,
      };

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(scheduledCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue([]);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);

      await dmBroadcastEngine.checkScheduledCampaigns();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND id NOT IN'),
        expect.any(Array)
      );
    });

    it('should skip campaigns scheduled for future', async () => {
      const future = new Date(Date.now() + 3600000);

      (query as jest.Mock).mockResolvedValue({ rows: [] });

      await dmBroadcastEngine.checkScheduledCampaigns();

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('scheduled_at <='),
        expect.any(Array)
      );
    });
  });

  describe('startScheduler', () => {
    it('should start scheduler with default interval', () => {
      jest.useFakeTimers();

      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      dmBroadcastEngine.startScheduler();

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

      setIntervalSpy.mockRestore();
    });

    it('should start scheduler with custom interval', () => {
      jest.useFakeTimers();

      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      dmBroadcastEngine.startScheduler(30000);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

      setIntervalSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle Instagram account not found error', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'pending',
          created_at: new Date(),
        },
      ];

      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockResolvedValue(mockRecipients);
      (dmCampaignService.updateCampaignStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateCampaignStats as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.updateRecipientStatus as jest.Mock).mockResolvedValue(undefined);
      (dmCampaignService.logDMActivity as jest.Mock).mockResolvedValue(undefined);
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const mockSendDM = jest.fn().mockRejectedValue(new Error('Instagram account not found'));
      (InstagramGraphClient as jest.Mock).mockImplementation(() => ({
        sendDM: mockSendDM,
      }));

      await dmBroadcastEngine.executeCampaign('campaign-1');

      expect(dmCampaignService.updateRecipientStatus).toHaveBeenCalledWith(
        'recipient-1',
        'failed',
        'Instagram account not found'
      );
    });

    it('should log errors during scheduled campaign execution', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const now = new Date();
      const scheduledCampaign = {
        ...mockCampaign,
        status: 'scheduled' as const,
        scheduled_at: now,
      };

      (query as jest.Mock).mockResolvedValue({ rows: [scheduledCampaign] });
      (dmCampaignService.getCampaignById as jest.Mock).mockResolvedValue(scheduledCampaign);
      (dmCampaignService.getCampaignRecipients as jest.Mock).mockRejectedValue(new Error('Database error'));

      await dmBroadcastEngine.checkScheduledCampaigns();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error executing scheduled campaign:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle scheduler errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await dmBroadcastEngine.checkScheduledCampaigns();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in campaign scheduler:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
