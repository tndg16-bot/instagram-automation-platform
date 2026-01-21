import { describe, beforeAll, afterAll, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app';

describe('DM Step Sequence Integration Tests', () => {
  let authToken: string;
  let campaignId: string;
  let stepId: string;

  beforeAll(async () => {
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    if (loginResponse.body.success && loginResponse.body.data) {
      authToken = loginResponse.body.data.access_token;
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    if (authToken) {
      const campaignsResponse = await request(app)
        .get('/api/dm/campaigns')
        .set('Authorization', `Bearer ${authToken}`);

      if (campaignsResponse.body.success && campaignsResponse.body.campaigns) {
        for (const campaign of campaignsResponse.body.campaigns) {
          if (campaign.name.includes('Test Integration')) {
            await request(app)
              .delete(`/api/dm/campaigns/${campaign.id}`)
              .set('Authorization', `Bearer ${authToken}`);
          }
        }
      }
    }
  });

  describe('Campaign Creation', () => {
    it('should create a step sequence campaign', async () => {
      const response = await request(app)
        .post('/api/dm/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Integration Campaign',
          message: 'Test message',
          message_type: 'TEXT',
          campaign_type: 'sequence',
          instagram_account_id: 'test-account-id',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.campaign_type).toBe('sequence');

      campaignId = response.body.data.id;
    });

    it('should return error when missing required fields', async () => {
      const response = await request(app)
        .post('/api/dm/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Test message',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Step Management', () => {
    beforeEach(async () => {
      // Create a test campaign for step tests
      const campaignResponse = await request(app)
        .post('/api/dm/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Step Campaign',
          message: 'Test message',
          message_type: 'TEXT',
          campaign_type: 'sequence',
          instagram_account_id: 'test-account-id',
        });

      if (campaignResponse.body.success && campaignResponse.body.data) {
        campaignId = campaignResponse.body.data.id;
      }
    });

    it('should add a step to a campaign', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'First step message',
          delay_hours: 0,
          media_url: null,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.step_order).toBe(1);

      stepId = response.body.data.id;
    });

    it('should add a step with trigger condition', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 2,
          message: 'Second step with condition',
          delay_hours: 24,
          trigger_condition: {
            type: 'contains',
            field: 'response',
            value: 'yes',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trigger_condition).toBeDefined();
      expect(response.body.data.trigger_condition.type).toBe('contains');
    });

    it('should retrieve all steps for a campaign', async () => {
      // Add two steps
      await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Step 1',
          delay_hours: 0,
        });

      await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 2,
          message: 'Step 2',
          delay_hours: 1,
        });

      const response = await request(app)
        .get(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.steps)).toBe(true);
      expect(response.body.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a step', async () => {
      const createResponse = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Original message',
          delay_hours: 0,
        });

      const createdStepId = createResponse.body.data.id;

      const updateResponse = await request(app)
        .put(`/api/dm/campaigns/${campaignId}/steps/${createdStepId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Updated message',
          delay_hours: 5,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.message).toBe('Updated message');
      expect(updateResponse.body.data.delay_hours).toBe(5);
    });

    it('should delete a step', async () => {
      const createResponse = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Step to delete',
          delay_hours: 0,
        });

      const createdStepId = createResponse.body.data.id;

      // Verify step exists
      const getResponse = await request(app)
        .get(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.steps.some((s: any) => s.id === createdStepId)).toBe(true);

      // Delete step
      const deleteResponse = await request(app)
        .delete(`/api/dm/campaigns/${campaignId}/steps/${createdStepId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify step is deleted
      const getAfterDeleteResponse = await request(app)
        .get(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getAfterDeleteResponse.body.steps.some((s: any) => s.id === createdStepId)).toBe(false);
    });
  });

  describe('Trigger Condition Logic', () => {
    it('should support equals operator', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Step with equals condition',
          delay_hours: 0,
          trigger_condition: {
            type: 'equals',
            field: 'response',
            value: 'yes',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.trigger_condition.type).toBe('equals');
    });

    it('should support contains operator', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 2,
          message: 'Step with contains condition',
          delay_hours: 0,
          trigger_condition: {
            type: 'contains',
            field: 'response',
            value: 'interested',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.trigger_condition.type).toBe('contains');
    });

    it('should support greater_than operator', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 3,
          message: 'Step with greater_than condition',
          delay_hours: 0,
          trigger_condition: {
            type: 'greater_than',
            field: 'engagement_score',
            value: 50,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.trigger_condition.type).toBe('greater_than');
    });

    it('should support regex operator', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 4,
          message: 'Step with regex condition',
          delay_hours: 0,
          trigger_condition: {
            type: 'regex',
            field: 'response',
            value: '^(yes|interested|ready)$',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.trigger_condition.type).toBe('regex');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/dm/campaigns');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await request(app)
        .get('/api/dm/campaigns/non-existent-id/steps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid trigger operator', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Step with invalid operator',
          delay_hours: 0,
          trigger_condition: {
            type: 'invalid_operator',
            field: 'response',
            value: 'yes',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for negative delay hours', async () => {
      const response = await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Step with negative delay',
          delay_hours: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Campaign Execution Flow', () => {
    it('should create and execute a multi-step sequence', async () => {
      // Create campaign
      const campaignResponse = await request(app)
        .post('/api/dm/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Multi-Step Integration Campaign',
          message: 'Initial message',
          message_type: 'TEXT',
          campaign_type: 'sequence',
          instagram_account_id: 'test-account-id',
        });

      campaignId = campaignResponse.body.data.id;

      // Add steps
      await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 1,
          message: 'Welcome message',
          delay_hours: 0,
        });

      await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 2,
          message: 'Follow-up message',
          delay_hours: 24,
          trigger_condition: {
            type: 'contains',
            field: 'response',
            value: 'interested',
          },
        });

      await request(app)
        .post(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          step_order: 3,
          message: 'Final message',
          delay_hours: 48,
        });

      // Verify all steps exist
      const stepsResponse = await request(app)
        .get(`/api/dm/campaigns/${campaignId}/steps`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(stepsResponse.body.success).toBe(true);
      expect(stepsResponse.body.steps.length).toBe(3);

      // Verify steps are ordered correctly
      const sortedSteps = stepsResponse.body.steps.sort((a: any, b: any) => a.step_order - b.step_order);
      expect(sortedSteps[0].step_order).toBe(1);
      expect(sortedSteps[1].step_order).toBe(2);
      expect(sortedSteps[2].step_order).toBe(3);
    });
  });

  afterAll(async () => {
    // Clean up test campaigns
    if (authToken) {
      const campaignsResponse = await request(app)
        .get('/api/dm/campaigns')
        .set('Authorization', `Bearer ${authToken}`);

      if (campaignsResponse.body.success && campaignsResponse.body.campaigns) {
        for (const campaign of campaignsResponse.body.campaigns) {
          if (campaign.name.includes('Test Integration')) {
            await request(app)
              .delete(`/api/dm/campaigns/${campaign.id}`)
              .set('Authorization', `Bearer ${authToken}`);
          }
        }
      }
    }
  });
});
