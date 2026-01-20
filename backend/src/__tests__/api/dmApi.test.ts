import request from 'supertest';
import app from '../../app';
import { query } from '../../config/database';
import { createMockUser, createMockInstagramAccount } from '../utils/testHelpers';

// Mock database
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

describe('DM API Integration Tests', () => {
  const mockUser = createMockUser({ id: 'user-1' });
  const mockInstagramAccount = createMockInstagramAccount({
    id: 'ig-account-1',
    user_id: 'user-1',
  });

  describe('POST /api/dm/campaigns', () => {
    it('should create a new DM campaign', async () => {
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

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [mockCampaign] });

      const response = await request(app)
        .post('/api/dm/campaigns')
        .send({
          user_id: 'user-1',
          instagram_account_id: 'ig-account-1',
          name: 'Test Campaign',
          message: 'Test message',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Campaign');
    });

    it('should validate required fields', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ ...mockUser }] });

      const response = await request(app).post('/api/dm/campaigns').send({
        name: 'Test Campaign',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/dm/campaigns', () => {
    it('should retrieve all campaigns for user', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          user_id: 'user-1',
          name: 'Campaign 1',
          status: 'draft',
          sent_count: 0,
          failed_count: 0,
          created_at: new Date(),
        },
      ];

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: mockCampaigns });

      const response = await request(app).get('/api/dm/campaigns?user_id=user-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /api/dm/campaigns/:id', () => {
    it('should retrieve specific campaign', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        user_id: 'user-1',
        name: 'Test Campaign',
        status: 'draft',
        sent_count: 0,
        failed_count: 0,
        created_at: new Date(),
      };

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [mockCampaign] });

      const response = await request(app).get('/api/dm/campaigns/campaign-1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Campaign');
    });

    it('should return 404 for non-existent campaign', async () => {
      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/dm/campaigns/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/dm/campaigns/:id/execute', () => {
    it('should start campaign execution', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        user_id: 'user-1',
        name: 'Test Campaign',
        status: 'draft',
        sent_count: 0,
        failed_count: 0,
        created_at: new Date(),
      };

      const mockRecipients = [
        {
          id: 'recipient-1',
          campaign_id: 'campaign-1',
          recipient_id: 'ig-user-1',
          status: 'pending',
          created_at: new Date(),
        },
      ];

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [mockCampaign] })
        .mockResolvedValueOnce({ rows: [mockRecipients] });

      const response = await request(app).post('/api/dm/campaigns/campaign-1/execute');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Campaign execution started');
    });

    it('should return 404 for non-existent campaign', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [{ ...mockUser }] });

      const response = await request(app).post('/api/dm/campaigns/non-existent/execute');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/dm/segments', () => {
    it('should create a new segment', async () => {
      const mockSegment = {
        id: 'segment-1',
        user_id: 'user-1',
        instagram_account_id: 'ig-account-1',
        name: 'High Engagement Users',
        conditions: [],
        is_dynamic: true,
        size: 100,
        created_at: new Date(),
      };

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [mockSegment] });

      const response = await request(app).post('/api/dm/segments').send({
        user_id: 'user-1',
        instagram_account_id: 'ig-account-1',
        name: 'High Engagement Users',
        conditions: [],
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('High Engagement Users');
    });
  });

  describe('GET /api/dm/segments', () => {
    it('should retrieve all segments for user', async () => {
      const mockSegments = [
        {
          id: 'segment-1',
          user_id: 'user-1',
          name: 'Segment 1',
          conditions: [],
          is_dynamic: true,
          size: 100,
          created_at: new Date(),
        },
      ];

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: mockSegments });

      const response = await request(app).get('/api/dm/segments?user_id=user-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/dm/templates', () => {
    it('should create a new message template', async () => {
      const mockTemplate = {
        id: 'template-1',
        user_id: 'user-1',
        name: 'Welcome Message',
        message: 'Welcome to our community!',
        category: 'onboarding',
        tags: ['welcome', 'onboarding'],
        usage_count: 0,
        created_at: new Date(),
      };

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [mockTemplate] });

      const response = await request(app).post('/api/dm/templates').send({
        user_id: 'user-1',
        name: 'Welcome Message',
        message: 'Welcome to our community!',
        category: 'onboarding',
        tags: ['welcome', 'onboarding'],
      });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Welcome Message');
    });
  });

  describe('GET /api/dm/templates', () => {
    it('should retrieve all templates for user', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          user_id: 'user-1',
          name: 'Template 1',
          message: 'Message 1',
          usage_count: 10,
          created_at: new Date(),
        },
      ];

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: mockTemplates });

      const response = await request(app).get('/api/dm/templates?user_id=user-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/dm/campaigns/:id/steps', () => {
    it('should create a new step in sequence', async () => {
      const mockStep = {
        id: 'step-1',
        campaign_id: 'campaign-1',
        step_order: 1,
        message: 'First message',
        delay_hours: 0,
        trigger_condition: null,
        created_at: new Date(),
      };

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: [mockStep] });

      const response = await request(app)
        .post('/api/dm/campaigns/campaign-1/steps')
        .send({
          step_order: 1,
          message: 'First message',
          delay_hours: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.step_order).toBe(1);
    });
  });

  describe('GET /api/dm/campaigns/:id/steps', () => {
    it('should retrieve all steps for campaign', async () => {
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

      (query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ ...mockUser }] })
        .mockResolvedValueOnce({ rows: mockSteps });

      const response = await request(app).get('/api/dm/campaigns/campaign-1/steps');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });
});
