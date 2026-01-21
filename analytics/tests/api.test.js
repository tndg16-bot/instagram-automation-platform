const request = require('supertest');
const app = require('../src/index');

describe('Analytics API', () => {
  test('GET /api/health returns status ok', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      service: 'analytics'
    });
  });

  test('GET /api/analytics/overview returns metrics', async () => {
    const response = await request(app)
      .get('/api/analytics/overview')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('totalUsers');
    expect(response.body).toHaveProperty('activeCampaigns');
    expect(response.body).toHaveProperty('totalDMSent');
    expect(response.body).toHaveProperty('totalReplies');
    expect(response.body).toHaveProperty('engagementRate');
  });

  test('GET /api/analytics/growth returns growth data', async () => {
    const response = await request(app)
      .get('/api/analytics/growth')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('userGrowth');
    expect(response.body).toHaveProperty('campaignGrowth');
  });
});
