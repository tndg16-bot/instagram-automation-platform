import { Pool } from 'pg';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

// Mock database connection - must be after uuid mock but before service import
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

const { query } = require('../../config/database');
import { createMockPool, mockQueryResult, createMockUser, createMockInstagramAccount } from '../utils/testHelpers';
import dmCampaignService from '../../services/dmCampaignService';

describe('DMCampaignService Integration Tests', () => {
  const mockUser = createMockUser({ id: 'user-1' });
  const mockInstagramAccount = createMockInstagramAccount({ id: 'ig-account-1' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a new DM campaign successfully', async () => {
      const campaignData = {
        user_id: mockUser.id,
        instagram_account_id: mockInstagramAccount.id,
        name: 'Test Campaign',
        message: 'Hello, this is a test message',
        message_type: 'TEXT',
      };

      const mockCampaign = {
        id: 'test-uuid-123',
        ...campaignData,
        status: 'draft',
        sent_count: 0,
        failed_count: 0,
        delivered_count: 0,
        read_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockCampaign]));

      const result = await dmCampaignService.createCampaign(campaignData);

      expect(result).toEqual(mockCampaign);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dm_campaigns'),
        expect.arrayContaining([
          campaignData.user_id,
          campaignData.instagram_account_id,
          campaignData.name,
          campaignData.message,
          campaignData.message_type,
          null,
          null,
          null,
        ])
      );
    });

    it('should create campaign with default message_type TEXT', async () => {
      const campaignData = {
        user_id: mockUser.id,
        instagram_account_id: mockInstagramAccount.id,
        name: 'Test Campaign',
        message: 'Hello',
      };

      const mockCampaign = {
        id: 'test-uuid-123',
        ...campaignData,
        message_type: 'TEXT',
        status: 'draft',
        sent_count: 0,
        failed_count: 0,
        delivered_count: 0,
        read_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockCampaign]));

      const result = await dmCampaignService.createCampaign(campaignData);

      expect(result.message_type).toBe('TEXT');
    });

    it('should create scheduled campaign', async () => {
      const scheduledAt = new Date('2026-01-25T10:00:00Z');
      const campaignData = {
        user_id: mockUser.id,
        instagram_account_id: mockInstagramAccount.id,
        name: 'Scheduled Campaign',
        message: 'Scheduled message',
        scheduled_at: scheduledAt,
      };

      const mockCampaign = {
        id: 'test-uuid-123',
        ...campaignData,
        message_type: 'TEXT',
        status: 'draft',
        sent_count: 0,
        failed_count: 0,
        delivered_count: 0,
        read_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockCampaign]));

      const result = await dmCampaignService.createCampaign(campaignData);

      expect(result.scheduled_at).toEqual(scheduledAt);
    });
  });

  describe('getCampaignById', () => {
    it('should retrieve campaign by ID', async () => {
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

      query.mockResolvedValueOnce(mockQueryResult([mockCampaign]));

      const result = await dmCampaignService.getCampaignById('campaign-1');

      expect(result).toEqual(mockCampaign);
      expect(query).toHaveBeenCalledWith('SELECT * FROM dm_campaigns WHERE id = $1', ['campaign-1']);
    });

    it('should return null for non-existent campaign', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      const result = await dmCampaignService.getCampaignById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getCampaignsByUserId', () => {
    it('should retrieve all campaigns for a user', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          user_id: mockUser.id,
          name: 'Campaign 1',
          message: 'Message 1',
          status: 'draft',
          sent_count: 0,
          failed_count: 0,
          delivered_count: 0,
          read_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'campaign-2',
          user_id: mockUser.id,
          name: 'Campaign 2',
          message: 'Message 2',
          status: 'completed',
          sent_count: 100,
          failed_count: 5,
          delivered_count: 95,
          read_count: 50,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      query.mockResolvedValueOnce(mockQueryResult(mockCampaigns));

      const result = await dmCampaignService.getCampaignsByUserId(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockCampaigns);
      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM dm_campaigns WHERE user_id = $1 ORDER BY created_at DESC',
        [mockUser.id]
      );
    });

    it('should return empty array for user with no campaigns', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      const result = await dmCampaignService.getCampaignsByUserId('user-with-no-campaigns');

      expect(result).toEqual([]);
    });
  });

  describe('updateCampaignStatus', () => {
    it('should update campaign status successfully', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateCampaignStatus('campaign-1', 'sending');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_campaigns SET status = $1'),
        expect.arrayContaining(['sending', 'campaign-1'])
      );
    });

    it('should update campaign status with error message', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateCampaignStatus('campaign-1', 'failed', 'Rate limit exceeded');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_campaigns SET status = $1, error_message = $2'),
        expect.arrayContaining(['failed', 'Rate limit exceeded'])
      );
    });
  });

  describe('updateCampaignStats', () => {
    it('should update individual stat fields', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateCampaignStats('campaign-1', { sent_count: 50 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_campaigns SET sent_count = $1 WHERE id = $2'),
        [50, 'campaign-1']
      );
    });

    it('should update multiple stat fields', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateCampaignStats('campaign-1', {
        total_recipients: 100,
        sent_count: 95,
        failed_count: 5,
        delivered_count: 90,
        read_count: 45,
      });

      const callArgs = query.mock.calls[0];
      expect(callArgs[0]).toContain('total_recipients = $1');
      expect(callArgs[0]).toContain('sent_count = $2');
      expect(callArgs[0]).toContain('failed_count = $3');
      expect(callArgs[0]).toContain('delivered_count = $4');
      expect(callArgs[0]).toContain('read_count = $5');
    });
  });

  describe('addRecipientToCampaign', () => {
    it('should add recipient to campaign successfully', async () => {
      const mockRecipient = {
        id: 'recipient-1',
        campaign_id: 'campaign-1',
        recipient_id: 'ig-user-123',
        recipient_username: 'testuser',
        status: 'pending',
        sent_at: null,
        delivered_at: null,
        read_at: null,
        error_message: null,
        created_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockRecipient]));

      const result = await dmCampaignService.addRecipientToCampaign({
        campaign_id: 'campaign-1',
        recipient_id: 'ig-user-123',
        recipient_username: 'testuser',
      });

      expect(result).toEqual(mockRecipient);
    });

    it('should add recipient without username', async () => {
      const mockRecipient = {
        id: 'recipient-1',
        campaign_id: 'campaign-1',
        recipient_id: 'ig-user-456',
        recipient_username: null,
        status: 'pending',
        created_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockRecipient]));

      const result = await dmCampaignService.addRecipientToCampaign({
        campaign_id: 'campaign-1',
        recipient_id: 'ig-user-456',
      });

      expect(result.recipient_username).toBeNull();
    });
  });

  describe('updateRecipientStatus', () => {
    it('should update recipient status to sent', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateRecipientStatus('recipient-1', 'sent');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_campaign_recipients SET status = $1, sent_at = NOW()'),
        expect.arrayContaining(['sent'])
      );
    });

    it('should update recipient status to delivered', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateRecipientStatus('recipient-1', 'delivered');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_campaign_recipients SET status = $1, delivered_at = NOW()'),
        expect.arrayContaining(['delivered'])
      );
    });

    it('should update recipient status to read', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateRecipientStatus('recipient-1', 'read');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE dm_campaign_recipients SET status = $1, read_at = NOW()'),
        expect.arrayContaining(['read'])
      );
    });

    it('should update recipient status with error message', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.updateRecipientStatus('recipient-1', 'failed', 'User blocked DMs');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('error_message = $2'),
        expect.arrayContaining(['failed', 'User blocked DMs'])
      );
    });
  });

  describe('getCampaignRecipients', () => {
    it('should retrieve all recipients for a campaign', async () => {
      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          recipient_username: 'user1',
          status: 'sent',
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

      query.mockResolvedValueOnce(mockQueryResult(mockRecipients));

      const result = await dmCampaignService.getCampaignRecipients('campaign-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockRecipients);
    });
  });

  describe('Segment Management', () => {
    it('should create a segment', async () => {
      const segmentData = {
        user_id: mockUser.id,
        instagram_account_id: mockInstagramAccount.id,
        name: 'High Engagement Users',
        description: 'Users with >1000 followers',
        conditions: [{ field: 'followers', operator: 'greater_than', value: 1000 }],
        is_dynamic: true,
      };

      const mockSegment = {
        id: 'segment-1',
        ...segmentData,
        conditions: JSON.stringify(segmentData.conditions),
        size: 150,
        last_updated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockSegment]));

      const result = await dmCampaignService.createSegment(segmentData);

      expect(result).toEqual(mockSegment);
    });

    it('should retrieve segments by user ID', async () => {
      const mockSegments = [
        {
          id: 'segment-1',
          user_id: mockUser.id,
          name: 'Segment 1',
          conditions: '[]',
          is_dynamic: true,
          size: 100,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      query.mockResolvedValueOnce(mockQueryResult(mockSegments));

      const result = await dmCampaignService.getSegmentsByUserId(mockUser.id);

      expect(result).toHaveLength(1);
      expect(result).toEqual(mockSegments);
    });
  });

  describe('Template Management', () => {
    it('should create a message template', async () => {
      const templateData = {
        user_id: mockUser.id,
        name: 'Welcome Message',
        message: 'Welcome to our community!',
        message_type: 'TEXT',
        category: 'onboarding',
        tags: ['welcome', 'onboarding'],
      };

      const mockTemplate = {
        id: 'template-1',
        ...templateData,
        media_url: null,
        tags: JSON.stringify(templateData.tags),
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      query.mockResolvedValueOnce(mockQueryResult([mockTemplate]));

      const result = await dmCampaignService.createTemplate(templateData);

      expect(result).toEqual(mockTemplate);
    });

    it('should retrieve templates by user ID', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          user_id: mockUser.id,
          name: 'Template 1',
          message: 'Message 1',
          usage_count: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      query.mockResolvedValueOnce(mockQueryResult(mockTemplates));

      const result = await dmCampaignService.getTemplatesByUserId(mockUser.id);

      expect(result).toHaveLength(1);
    });

    it('should increment template usage count', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.incrementTemplateUsage('template-1');

      expect(query).toHaveBeenCalledWith(
        'UPDATE dm_message_templates SET usage_count = usage_count + 1 WHERE id = $1',
        ['template-1']
      );
    });
  });

  describe('DM Activity Logging', () => {
    it('should log DM activity', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.logDMActivity({
        user_id: mockUser.id,
        instagram_account_id: mockInstagramAccount.id,
        campaign_id: 'campaign-1',
        recipient_id: 'ig-user-123',
        action: 'sent',
        details: { recipient_username: 'testuser' },
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dm_logs'),
        expect.arrayContaining([
          mockUser.id,
          mockInstagramAccount.id,
          'campaign-1',
          'ig-user-123',
          'sent',
          expect.any(String),
        ])
      );
    });

    it('should log activity with minimal data', async () => {
      query.mockResolvedValueOnce(mockQueryResult([]));

      await dmCampaignService.logDMActivity({
        user_id: mockUser.id,
        action: 'campaign_created',
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dm_logs'),
        expect.arrayContaining([mockUser.id, null, null, null, 'campaign_created', null])
      );
    });
  });
});
