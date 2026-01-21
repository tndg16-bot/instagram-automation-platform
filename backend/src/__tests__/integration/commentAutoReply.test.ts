import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import pool from '../../config/database';

describe('Comment Auto-Reply Integration Tests', () => {
  let testUserId: string;
  let testToken: string;
  let testInstagramAccountId: string;

  beforeAll(async () => {
    // Create test user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      ['test@example.com', '$2b$10$test_hash', 'Test User']
    );
    testUserId = userResult.rows[0].id;

    // Create test Instagram account
    const igResult = await pool.query(
      'INSERT INTO instagram_accounts (user_id, instagram_user_id, username, access_token) VALUES ($1, $2, $3, $4) RETURNING id',
      [testUserId, '17841400000000000', 'test_instagram', 'mock_access_token']
    );
    testInstagramAccountId = igResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM comment_reply_templates WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM comment_keyword_rules WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM instagram_comments WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM instagram_accounts WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  beforeEach(async () => {
    // Register user and get token
    const authResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    testToken = loginResponse.body.token;

    // Create test keyword rules
    await pool.query(
      'INSERT INTO comment_keyword_rules (user_id, keyword) VALUES ($1, $2), ($1, $3)',
      [testUserId, '価格', 'price']
    );

    // Create test template
    await pool.query(
      'INSERT INTO comment_reply_templates (user_id, template_name, content) VALUES ($1, $2, $3)',
      [testUserId, 'Price Inquiry', '{username}さん、価格についてはDMでお送りします！']
    );
  });

  afterEach(async () => {
    // Cleanup comments
    await pool.query('DELETE FROM instagram_comments WHERE user_id = $1', [testUserId]);
  });

  describe('Comment Statistics API', () => {
    it('should get comment statistics', async () => {
      const response = await request(app)
        .get('/api/comments/stats')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total_comments).toBeDefined();
      expect(response.body.stats.pending_comments).toBeDefined();
      expect(response.body.stats.replied_comments).toBeDefined();
      expect(response.body.stats.ignored_comments).toBeDefined();
      expect(response.body.stats.recent_replies).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/comments/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('Comments List API', () => {
    it('should get all comments for user', async () => {
      // Create test comment
      await pool.query(
        'INSERT INTO instagram_comments (comment_id, username, text, media_id, status, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['comment_1', 'user1', '価格教えて', 'media_1', 'pending', testUserId]
      );

      const response = await request(app)
        .get('/api/comments')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comments).toBeDefined();
      expect(response.body.comments.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter comments by status', async () => {
      await pool.query(
        'INSERT INTO instagram_comments (comment_id, username, text, media_id, status, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['comment_1', 'user1', '価格教えて', 'media_1', 'pending', testUserId]
      );

      const response = await request(app)
        .get('/api/comments?status=pending')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comments.every((c: any) => c.status === 'pending')).toBe(true);
    });
  });

  describe('Reply Templates API', () => {
    it('should create a reply template', async () => {
      const response = await request(app)
        .post('/api/comments/templates')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          template_name: 'Welcome Message',
          content: '{username}さん、ようこそ！'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.template_name).toBe('Welcome Message');
    });

    it('should get all reply templates', async () => {
      const response = await request(app)
        .get('/api/comments/templates')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should update a reply template', async () => {
      // Create template first
      const createResponse = await request(app)
        .post('/api/comments/templates')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          template_name: 'Test Template',
          content: 'Test content'
        });

      const templateId = createResponse.body.data.id;

      // Update template
      const updateResponse = await request(app)
        .put(`/api/comments/templates/${templateId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          template_name: 'Updated Template',
          content: 'Updated content',
          is_active: false
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
    });

    it('should delete a reply template', async () => {
      // Create template first
      const createResponse = await request(app)
        .post('/api/comments/templates')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          template_name: 'Test Template',
          content: 'Test content'
        });

      const templateId = createResponse.body.data.id;

      // Delete template
      const deleteResponse = await request(app)
        .delete(`/api/comments/templates/${templateId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Keyword Rules API', () => {
    it('should create a keyword rule', async () => {
      const response = await request(app)
        .post('/api/comments/keywords')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          keyword: '在庫'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.keyword).toBe('在庫');
    });

    it('should get all keyword rules', async () => {
      const response = await request(app)
        .get('/api/comments/keywords')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rules).toBeDefined();
      expect(Array.isArray(response.body.rules)).toBe(true);
    });

    it('should update a keyword rule', async () => {
      // Create rule first
      const createResponse = await request(app)
        .post('/api/comments/keywords')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          keyword: 'test_keyword'
        });

      const ruleId = createResponse.body.data.id;

      // Update rule
      const updateResponse = await request(app)
        .put(`/api/comments/keywords/${ruleId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          keyword: 'updated_keyword',
          is_active: false
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
    });

    it('should delete a keyword rule', async () => {
      // Create rule first
      const createResponse = await request(app)
        .post('/api/comments/keywords')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          keyword: 'test_keyword'
        });

      const ruleId = createResponse.body.data.id;

      // Delete rule
      const deleteResponse = await request(app)
        .delete(`/api/comments/keywords/${ruleId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Comment Status Update API', () => {
    it('should update comment status to replied', async () => {
      // Create test comment
      await pool.query(
        'INSERT INTO instagram_comments (comment_id, username, text, media_id, status, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['comment_1', 'user1', 'テスト', 'media_1', 'pending', testUserId]
      );

      const response = await request(app)
        .put('/api/comments/comment_1')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'replied',
          reply_message_id: 'reply_1'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify in database
      const dbResult = await pool.query(
        'SELECT status FROM instagram_comments WHERE comment_id = $1',
        ['comment_1']
      );
      expect(dbResult.rows[0].status).toBe('replied');
    });

    it('should update comment status to ignored', async () => {
      // Create test comment
      await pool.query(
        'INSERT INTO instagram_comments (comment_id, username, text, media_id, status, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['comment_1', 'user1', 'テスト', 'media_1', 'pending', testUserId]
      );

      const response = await request(app)
        .put('/api/comments/comment_1')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'ignored'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify in database
      const dbResult = await pool.query(
        'SELECT status FROM instagram_comments WHERE comment_id = $1',
        ['comment_1']
      );
      expect(dbResult.rows[0].status).toBe('ignored');
    });
  });

  describe('Auto-Reply Trigger API', () => {
    it('should trigger auto-reply for pending comments', async () => {
      // Create test comments
      await pool.query(
        'INSERT INTO instagram_comments (comment_id, username, text, media_id, status, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        ['comment_1', 'user1', '価格教えて', 'media_1', 'pending', testUserId]
      );

      const response = await request(app)
        .post('/api/comments/auto-reply')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          instagram_account_id: testInstagramAccountId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.replied_count).toBeDefined();
      expect(typeof response.body.data.replied_count).toBe('number');
    });

    it('should return error without instagram_account_id', async () => {
      const response = await request(app)
        .post('/api/comments/auto-reply')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
