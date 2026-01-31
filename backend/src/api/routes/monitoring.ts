import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';

const router = Router();

/**
 * GET /api/monitoring/health
 * Health check endpoint for monitoring
 */
router.get('/health', async (req: AuthRequest, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
      instagram_api: 'unknown',
    },
  };

  // Check database connectivity
  try {
    const { query } = require('../../config/database');
    await query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis connectivity (if implemented)
  try {
    const cacheService = require('../../services/cacheService');
    await cacheService.setCache('health-check', 'ok', 10);
    const result = await cacheService.getCache('health-check');
    health.services.redis = result === 'ok' ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/monitoring/metrics
 * Prometheus-style metrics endpoint
 */
router.get('/metrics', async (req: AuthRequest, res: Response) => {
  // Basic system metrics
  const metrics = {
    // Process metrics
    process_uptime_seconds: process.uptime(),
    process_memory_usage_bytes: process.memoryUsage(),
    
    // Event loop lag (simplified)
    event_loop_lag_seconds: 0,
    
    // Custom application metrics would be added here
    // For example: active_users, requests_per_minute, etc.
  };

  // Format as Prometheus exposition format
  let output = '';
  
  output += `# HELP process_uptime_seconds Process uptime in seconds\n`;
  output += `# TYPE process_uptime_seconds gauge\n`;
  output += `process_uptime_seconds ${metrics.process_uptime_seconds}\n`;
  
  output += `# HELP process_memory_usage_bytes Process memory usage\n`;
  output += `# TYPE process_memory_usage_bytes gauge\n`;
  output += `process_memory_usage_bytes{type="rss"} ${metrics.process_memory_usage_bytes.rss}\n`;
  output += `process_memory_usage_bytes{type="heapTotal"} ${metrics.process_memory_usage_bytes.heapTotal}\n`;
  output += `process_memory_usage_bytes{type="heapUsed"} ${metrics.process_memory_usage_bytes.heapUsed}\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(output);
});

/**
 * GET /api/monitoring/status
 * Detailed status for monitoring dashboards
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  // Only allow admin users
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const status = {
    server: {
      status: 'running',
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  res.json(status);
});

export default router;
