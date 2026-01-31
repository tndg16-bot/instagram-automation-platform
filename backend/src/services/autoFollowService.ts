import { query } from '../config/database';
import InstagramGraphClient from './instagramClient';

export interface AutoFollowSettings {
  id: string;
  user_id: string;
  instagram_account_id: string;
  is_active: boolean;
  target_hashtags: string[];
  target_locations: string[];
  competitor_accounts: string[];
  max_follows_per_day: number;
  max_unfollows_per_day: number;
  follow_delay_min: number;
  follow_delay_max: number;
  auto_unfollow_after_days: number;
  skip_private_accounts: boolean;
  skip_business_accounts: boolean;
  skip_verified_accounts: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FollowLog {
  id: string;
  user_id: string;
  instagram_account_id: string;
  target_user_id: string;
  target_username: string;
  action: 'follow' | 'unfollow';
  status: 'success' | 'failed' | 'skipped';
  error_message?: string;
  created_at: Date;
  unfollowed_at?: Date;
}

/**
 * Get auto-follow settings
 */
export const getAutoFollowSettings = async (
  userId: string,
  instagramAccountId: string
): Promise<AutoFollowSettings | null> => {
  const result = await query(
    'SELECT * FROM auto_follow_settings WHERE user_id = $1 AND instagram_account_id = $2',
    [userId, instagramAccountId]
  );

  if (result.rows.length === 0) return null;

  return {
    ...result.rows[0],
    target_hashtags: result.rows[0].target_hashtags || [],
    target_locations: result.rows[0].target_locations || [],
    competitor_accounts: result.rows[0].competitor_accounts || [],
  };
};

/**
 * Save auto-follow settings
 */
export const saveAutoFollowSettings = async (
  userId: string,
  instagramAccountId: string,
  settings: Partial<AutoFollowSettings>
): Promise<AutoFollowSettings> => {
  const result = await query(
    `INSERT INTO auto_follow_settings 
     (user_id, instagram_account_id, is_active, target_hashtags, target_locations, competitor_accounts,
      max_follows_per_day, max_unfollows_per_day, follow_delay_min, follow_delay_max,
      auto_unfollow_after_days, skip_private_accounts, skip_business_accounts, skip_verified_accounts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (user_id, instagram_account_id) DO UPDATE SET
     is_active = $3, target_hashtags = $4, target_locations = $5, competitor_accounts = $6,
     max_follows_per_day = $7, max_unfollows_per_day = $8, follow_delay_min = $9, follow_delay_max = $10,
     auto_unfollow_after_days = $11, skip_private_accounts = $12, skip_business_accounts = $13,
     skip_verified_accounts = $14, updated_at = NOW()
     RETURNING *`,
    [
      userId,
      instagramAccountId,
      settings.is_active ?? false,
      JSON.stringify(settings.target_hashtags || []),
      JSON.stringify(settings.target_locations || []),
      JSON.stringify(settings.competitor_accounts || []),
      settings.max_follows_per_day ?? 50,
      settings.max_unfollows_per_day ?? 50,
      settings.follow_delay_min ?? 60,
      settings.follow_delay_max ?? 300,
      settings.auto_unfollow_after_days ?? 3,
      settings.skip_private_accounts ?? true,
      settings.skip_business_accounts ?? false,
      settings.skip_verified_accounts ?? true,
    ]
  );

  return result.rows[0];
};

/**
 * Get today's follow/unfollow count
 */
export const getTodayActionCount = async (
  userId: string,
  instagramAccountId: string,
  action: 'follow' | 'unfollow'
): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) as count FROM follow_logs 
     WHERE user_id = $1 AND instagram_account_id = $2 AND action = $3
     AND created_at >= CURRENT_DATE`,
    [userId, instagramAccountId, action]
  );

  return parseInt(result.rows[0].count);
};

/**
 * Execute auto-follow
 */
export const executeAutoFollow = async (
  userId: string,
  instagramAccountId: string,
  accessToken: string
): Promise<{ processed: number; succeeded: number; failed: number }> => {
  const settings = await getAutoFollowSettings(userId, instagramAccountId);

  if (!settings || !settings.is_active) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const todayCount = await getTodayActionCount(userId, instagramAccountId, 'follow');
  if (todayCount >= settings.max_follows_per_day) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const client = new InstagramGraphClient(accessToken);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get followers of competitor accounts
    for (const competitor of settings.competitor_accounts) {
      if (processed >= 10) break;

      try {
        const users = await client.searchUsers(competitor, 1);
        if (!users || users.length === 0) continue;

        const followers = await client.getFollowers(20);

        for (const follower of followers) {
          if (processed >= 10) break;

          // Check if already followed
          const existing = await query(
            'SELECT id FROM follow_logs WHERE user_id = $1 AND target_user_id = $2',
            [userId, follower.id]
          );

          if (existing.rows.length > 0) continue;

          try {
            await client.followUser(follower.id);

            await query(
              `INSERT INTO follow_logs (user_id, instagram_account_id, target_user_id, target_username, action, status)
               VALUES ($1, $2, $3, $4, 'follow', 'success')`,
              [userId, instagramAccountId, follower.id, follower.username]
            );

            succeeded++;

            const delay = Math.floor(
              Math.random() * (settings.follow_delay_max - settings.follow_delay_min + 1) +
                settings.follow_delay_min
            );
            await new Promise((resolve) => setTimeout(resolve, delay * 1000));
          } catch (error: any) {
            await query(
              `INSERT INTO follow_logs (user_id, instagram_account_id, target_user_id, target_username, action, status, error_message)
               VALUES ($1, $2, $3, $4, 'follow', 'failed', $5)`,
              [userId, instagramAccountId, follower.id, follower.username, error.message]
            );
            failed++;
          }

          processed++;
        }
      } catch (error) {
        console.error(`Error processing competitor ${competitor}:`, error);
      }
    }
  } catch (error) {
    console.error('Auto-follow execution error:', error);
  }

  return { processed, succeeded, failed };
};

/**
 * Execute auto-unfollow (follow back users who don't follow back)
 */
export const executeAutoUnfollow = async (
  userId: string,
  instagramAccountId: string,
  accessToken: string
): Promise<{ processed: number; succeeded: number; failed: number }> => {
  const settings = await getAutoFollowSettings(userId, instagramAccountId);

  if (!settings || !settings.is_active || settings.auto_unfollow_after_days === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const todayCount = await getTodayActionCount(userId, instagramAccountId, 'unfollow');
  if (todayCount >= settings.max_unfollows_per_day) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const client = new InstagramGraphClient(accessToken);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get users to unfollow (followed X days ago but not following back)
    const toUnfollow = await query(
      `SELECT target_user_id, target_username FROM follow_logs 
       WHERE user_id = $1 AND instagram_account_id = $2 AND action = 'follow' AND status = 'success'
       AND created_at <= NOW() - INTERVAL '${settings.auto_unfollow_after_days} days'
       AND unfollowed_at IS NULL
       LIMIT ${settings.max_unfollows_per_day - todayCount}`,
      [userId, instagramAccountId]
    );

    for (const row of toUnfollow.rows) {
      try {
        await client.unfollowUser(row.target_user_id);

        await query(
          `UPDATE follow_logs SET unfollowed_at = NOW() 
           WHERE user_id = $1 AND target_user_id = $2 AND action = 'follow'`,
          [userId, row.target_user_id]
        );

        await query(
          `INSERT INTO follow_logs (user_id, instagram_account_id, target_user_id, target_username, action, status)
           VALUES ($1, $2, $3, $4, 'unfollow', 'success')`,
          [userId, instagramAccountId, row.target_user_id, row.target_username]
        );

        succeeded++;

        const delay = Math.floor(Math.random() * 60 + 30); // 30-90 seconds
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      } catch (error: any) {
        failed++;
      }

      processed++;
    }
  } catch (error) {
    console.error('Auto-unfollow execution error:', error);
  }

  return { processed, succeeded, failed };
};
