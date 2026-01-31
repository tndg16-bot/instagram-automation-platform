/**
 * Cron Job Scheduler
 * Handles automated tasks like auto-like, auto-follow, scheduled posts
 */

import { query } from '../config/database';
import * as autoLikeService from '../services/autoLikeService';
import * as autoFollowService from '../services/autoFollowService';
import * as scheduledPostService from '../services/scheduledPostService';
import * as welcomeDMService from '../services/welcomeDMService';
import * as webhookDeliveryService from '../services/webhookDeliveryService';

interface CronJob {
  id: string;
  name: string;
  schedule: string; // cron expression
  last_run?: Date;
  next_run?: Date;
  is_active: boolean;
}

/**
 * Execute auto-like jobs
 */
export const executeAutoLikeJobs = async (): Promise<{
  processed: number;
  total_likes: number;
}> => {
  console.log('[Cron] Executing auto-like jobs...');
  
  // Get all active auto-like settings
  const settingsResult = await query(
    `SELECT DISTINCT s.user_id, s.instagram_account_id, a.access_token
     FROM auto_like_settings s
     JOIN instagram_accounts a ON s.instagram_account_id = a.id
     WHERE s.is_active = TRUE`
  );

  let processed = 0;
  let totalLikes = 0;

  for (const setting of settingsResult.rows) {
    try {
      const result = await autoLikeService.executeAutoLike(
        setting.user_id,
        setting.instagram_account_id,
        setting.access_token
      );
      
      processed++;
      totalLikes += result.succeeded;
    } catch (error) {
      console.error(`[Cron] Auto-like failed for user ${setting.user_id}:`, error);
    }
  }

  console.log(`[Cron] Auto-like completed: ${processed} accounts, ${totalLikes} likes`);
  return { processed, total_likes: totalLikes };
};

/**
 * Execute auto-follow jobs
 */
export const executeAutoFollowJobs = async (): Promise<{
  processed: number;
  total_follows: number;
  total_unfollows: number;
}> => {
  console.log('[Cron] Executing auto-follow jobs...');
  
  // Get all active auto-follow settings
  const settingsResult = await query(
    `SELECT DISTINCT s.user_id, s.instagram_account_id, a.access_token
     FROM auto_follow_settings s
     JOIN instagram_accounts a ON s.instagram_account_id = a.id
     WHERE s.is_active = TRUE`
  );

  let processed = 0;
  let totalFollows = 0;
  let totalUnfollows = 0;

  for (const setting of settingsResult.rows) {
    try {
      // Execute follow
      const followResult = await autoFollowService.executeAutoFollow(
        setting.user_id,
        setting.instagram_account_id,
        setting.access_token
      );
      
      // Execute unfollow
      const unfollowResult = await autoFollowService.executeAutoUnfollow(
        setting.user_id,
        setting.instagram_account_id,
        setting.access_token
      );
      
      processed++;
      totalFollows += followResult.succeeded;
      totalUnfollows += unfollowResult.succeeded;
    } catch (error) {
      console.error(`[Cron] Auto-follow failed for user ${setting.user_id}:`, error);
    }
  }

  console.log(`[Cron] Auto-follow completed: ${processed} accounts, ${totalFollows} follows, ${totalUnfollows} unfollows`);
  return { processed, total_follows: totalFollows, total_unfollows: totalUnfollows };
};

/**
 * Execute scheduled posts
 */
export const executeScheduledPosts = async (): Promise<{
  processed: number;
  published: number;
  failed: number;
}> => {
  console.log('[Cron] Executing scheduled posts...');
  
  const result = await scheduledPostService.processScheduledPosts(50);
  
  console.log(`[Cron] Scheduled posts completed: ${result.processed} processed, ${result.succeeded} published, ${result.failed} failed`);
  return {
    processed: result.processed,
    published: result.succeeded,
    failed: result.failed
  };
};

/**
 * Process pending welcome DMs
 */
export const executeWelcomeDMs = async (): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> => {
  console.log('[Cron] Executing welcome DMs...');
  
  // This would process pending welcome DMs
  // Implementation depends on how welcome DMs are queued
  
  return { processed: 0, sent: 0, failed: 0 };
};

/**
 * Process webhook retries
 */
export const executeWebhookRetries = async (): Promise<{
  processed: number;
}> => {
  console.log('[Cron] Executing webhook retries...');
  
  const result = await webhookDeliveryService.processPendingWebhooks(100);
  
  console.log(`[Cron] Webhook retries completed: ${result.processed} processed`);
  return { processed: result.processed };
};

/**
 * Run all cron jobs
 */
export const runAllCronJobs = async (): Promise<{
  auto_like: { processed: number; total_likes: number };
  auto_follow: { processed: number; total_follows: number; total_unfollows: number };
  scheduled_posts: { processed: number; published: number; failed: number };
  welcome_dms: { processed: number; sent: number; failed: number };
  webhooks: { processed: number };
}> => {
  console.log('[Cron] Starting all cron jobs...');
  
  const startTime = Date.now();
  
  const results = await Promise.all([
    executeAutoLikeJobs(),
    executeAutoFollowJobs(),
    executeScheduledPosts(),
    executeWelcomeDMs(),
    executeWebhookRetries()
  ]);
  
  const duration = Date.now() - startTime;
  console.log(`[Cron] All jobs completed in ${duration}ms`);
  
  return {
    auto_like: results[0],
    auto_follow: results[1],
    scheduled_posts: results[2],
    welcome_dms: results[3],
    webhooks: results[4]
  };
};

/**
 * Initialize cron jobs
 * This would set up the actual cron schedule
 */
export const initializeCronJobs = (): void => {
  console.log('[Cron] Initializing cron jobs...');
  
  // In a real implementation, this would use node-cron or similar
  // to schedule the jobs at specific intervals
  
  // Example schedule:
  // - Auto-like: Every 30 minutes
  // - Auto-follow: Every hour
  // - Scheduled posts: Every 5 minutes
  // - Welcome DMs: Every 10 minutes
  // - Webhook retries: Every 15 minutes
  
  console.log('[Cron] Cron jobs initialized');
};
