import Redis from 'ioredis';
import config from '../config';

// Redis client instance
let redisClient: Redis | null = null;

/**
 * Get Redis client instance
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
    });
  }

  return redisClient;
};

/**
 * Cache data with TTL
 */
export const setCache = async (
  key: string,
  value: any,
  ttl: number = 3600 // Default 1 hour
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Get cached data
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Delete cached data
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Delete cached data by pattern
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
};

/**
 * Cache wrapper for function results
 */
export const cacheWrapper = <T>(
  fn: (...args: any[]) => Promise<T>,
  keyGenerator: (...args: any[]) => string,
  ttl: number = 3600
) => {
  return async (...args: any[]): Promise<T> => {
    const cacheKey = keyGenerator(...args);
    
    // Try to get from cache
    const cached = await getCache<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Store in cache
    await setCache(cacheKey, result, ttl);
    
    return result;
  };
};

/**
 * Cache keys generator
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userTenants: (userId: string) => `user:${userId}:tenants`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  tenantLimits: (tenantId: string, type: string) => `tenant:${tenantId}:limits:${type}`,
  instagramAccount: (accountId: string) => `ig_account:${accountId}`,
  membershipTiers: () => 'membership:tiers',
  userMembership: (userId: string) => `user:${userId}:membership`,
  workflow: (workflowId: string) => `workflow:${workflowId}`,
  analytics: (userId: string, metric: string, period: string) => 
    `analytics:${userId}:${metric}:${period}`,
};

export default {
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  cacheWrapper,
  cacheKeys,
};
