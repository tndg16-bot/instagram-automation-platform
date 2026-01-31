import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Ramp up to 10 users
    { duration: '5m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],      // Error rate under 10%
    errors: ['rate<0.05'],              // Custom error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Test 1: Health check endpoint
export function healthCheck() {
  const response = http.get(`${BASE_URL}/health`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(1);
}

// Test 2: API endpoints with authentication
export function apiEndpoints() {
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.API_TOKEN || 'test-token'}`,
      'Content-Type': 'application/json',
    },
  };

  // Get membership tiers
  const tiersResponse = http.get(`${BASE_URL}/api/membership/tiers`, params);
  check(tiersResponse, {
    'tiers endpoint status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(tiersResponse.status !== 200);
  responseTime.add(tiersResponse.timings.duration);

  // Get user membership status
  const statusResponse = http.get(`${BASE_URL}/api/membership/status`, params);
  check(statusResponse, {
    'membership status endpoint is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  
  errorRate.add(statusResponse.status !== 200 && statusResponse.status !== 401);
  responseTime.add(statusResponse.timings.duration);

  sleep(2);
}

// Test 3: Webhook endpoints
export function webhookEndpoints() {
  // Create webhook endpoint
  const payload = JSON.stringify({
    url: 'https://example.com/webhook',
    events: ['dm.received', 'comment.received'],
  });
  
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.API_TOKEN || 'test-token'}`,
      'Content-Type': 'application/json',
    },
  };

  const createResponse = http.post(
    `${BASE_URL}/api/webhooks/outbound/endpoints`,
    payload,
    params
  );
  
  check(createResponse, {
    'webhook create status is 201 or 401': (r) => r.status === 201 || r.status === 401,
  });
  
  errorRate.add(createResponse.status !== 201 && createResponse.status !== 401);
  responseTime.add(createResponse.timings.duration);

  // List webhooks
  const listResponse = http.get(
    `${BASE_URL}/api/webhooks/outbound/endpoints`,
    params
  );
  
  check(listResponse, {
    'webhook list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });
  
  errorRate.add(listResponse.status !== 200 && listResponse.status !== 401);
  responseTime.add(listResponse.timings.duration);

  sleep(1);
}

// Test 4: Heavy load on database operations
export function databaseOperations() {
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.API_TOKEN || 'test-token'}`,
    },
  };

  // Get community topics
  const topicsResponse = http.get(
    `${BASE_URL}/api/community/topics`,
    params
  );
  
  check(topicsResponse, {
    'topics endpoint status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(topicsResponse.status !== 200);
  responseTime.add(topicsResponse.timings.duration);

  // Get events
  const eventsResponse = http.get(
    `${BASE_URL}/api/events`,
    params
  );
  
  check(eventsResponse, {
    'events endpoint status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(eventsResponse.status !== 200);
  responseTime.add(eventsResponse.timings.duration);

  sleep(1);
}

// Default function
export default function () {
  const random = Math.random();
  
  if (random < 0.4) {
    healthCheck();
  } else if (random < 0.7) {
    apiEndpoints();
  } else if (random < 0.9) {
    webhookEndpoints();
  } else {
    databaseOperations();
  }
}
