import { query } from '../config/database';
import InstagramGraphClient from './instagramClient';

export interface AutoLikeSettings {
  id: string;
  user_id: string;
  instagram_account_id: string;
  is_active: boolean;
  target_hashtags: string[];
  target_accounts: string[];
  max_likes_per_day: number;
  like_delay_min: number;
  like_delay_max: number;
  skip_private_accounts: boolean;
  skip_business_accounts: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LikeLog {
  id: string;
  user_id: string;
  instagram_account_id: string;
  target_media_id: string;
  target_username: string;
  status: 'success' | 'failed' | 'skipped';
  error_message?: string;
  created_at: Date;
}

/**
 * Get auto-like settings for user
 */
export const getAutoLikeSettings = async (
  userId: string,
  instagramAccountId: string
): Promise<AutoLikeSettings | null> => {
  const result = await query(
    'SELECT * FROM auto_like_settings WHERE user_id = $1 AND instagram_account_id = $2',
    [userId, instagramAccountId]
  );

  if (result.rows.length === 0) return null;

  return {
    ...result.rows[0],
    target_hashtags: result.rows[0].target_hashtags || [],
    target_accounts: result.rows[0].target_accounts || [],
  };
};

/**
 * Save auto-like settings
 */
export const saveAutoLikeSettings = async (
  userId: string,
  instagramAccountId: string,
  settings: Partial<AutoLikeSettings>
): Promise<AutoLikeSettings> => {
  const result = await query(
    `INSERT INTO auto_like_settings 
     (user_id, instagram_account_id, is_active, target_hashtags, target_accounts, 
      max_likes_per_day, like_delay_min, like_delay_max, skip_private_accounts, skip_business_accounts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id, instagram_account_id) DO UPDATE SET
     is_active = $3, target_hashtags = $4, target_accounts = $5,
     max_likes_per_day = $6, like_delay_min = $7, like_delay_max = $8,
     skip_private_accounts = $9, skip_business_accounts = $10, updated_at = NOW()
     RETURNING *`,
    [
      userId,
      instagramAccountId,
      settings.is_active ?? false,
      JSON.stringify(settings.target_hashtags || []),
      JSON.stringify(settings.target_accounts || []),
      settings.max_likes_per_day ?? 100,
      settings.like_delay_min ?? 30,
      settings.like_delay_max ?? 120,
      settings.skip_private_accounts ?? true,
      settings.skip_business_accounts ?? false,
    ]
  );

  return result.rows[0];
};

/**
 * Get today's like count
 */
export const getTodayLikeCount = async (
  userId: string,
  instagramAccountId: string
): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) as count FROM like_logs 
     WHERE user_id = $1 AND instagram_account_id = $2 
     AND created_at >= CURRENT_DATE`,
    [userId, instagramAccountId]
  );

  return parseInt(result.rows[0].count);
};

/**
 * Execute auto-like for a user
 */
export const executeAutoLike = async (
  userId: string,
  instagramAccountId: string,
  accessToken: string
): Promise<{ processed: number; succeeded: number; failed: number }> => {
  const settings = await getAutoLikeSettings(userId, instagramAccountId);

  if (!settings || !settings.is_active) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const todayCount = await getTodayLikeCount(userId, instagramAccountId);
  if (todayCount >= settings.max_likes_per_day) {
    console.log(`Auto-like limit reached for user ${userId}`);
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const client = new InstagramGraphClient(accessToken);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Get recent media from target accounts
    for (const account of settings.target_accounts) {
      if (processed >= 10) break; // Limit per run

      try {
        // Search for user
        const users = await client.searchUsers(account, 1);
        if (!users || users.length === 0) continue;

        // Get user's recent media
        const media = await client.getUserMedia(users[0].id, 3);

        for (const item of media) {
          if (processed >= 10) break;

          // Check if already liked
          const existingLike = await query(
            'SELECT id FROM like_logs WHERE user_id = $1 AND target_media_id = $2 AND created_at >= CURRENT_DATE',
            [userId, item.id]
          );

          if (existingLike.rows.length > 0) continue;

          // Like the media
          try {
            await client.likeMedia(item.id);

            // Log success
            await query(
              `INSERT INTO like_logs (user_id, instagram_account_id, target_media_id, target_username, status)
               VALUES ($1, $2, $3, $4, 'success')`,
              [userId, instagramAccountId, item.id, account]
            );

            succeeded++;

            // Random delay
            const delay = Math.floor(
              Math.random() * (settings.like_delay_max - settings.like_delay_min + 1) +
                settings.like_delay_min
            );
            await new Promise((resolve) => setTimeout(resolve, delay * 1000));
          } catch (error: any) {
            // Log failure
            await query(
              `INSERT INTO like_logs (user_id, instagram_account_id, target_media_id, target_username, status, error_message)
               VALUES ($1, $2, $3, $4, 'failed', $5)`,
              [userId, instagramAccountId, item.id, account, error.message]
            );
            failed++;
          }

          processed++;
        }
      } catch (error) {
        console.error(`Error processing account ${account}:`, error);
      }
    }
  } catch (error) {
    console.error('Auto-like execution error:', error);
  }

  return { processed, succeeded, failed };
};

/**
 * Get like statistics
 */
export const getLikeStats = async (
  userId: string,
  instagramAccountId: string,
  days: number = 7
): Promise<{ date: string; count: number }[]> => {
  const result = await query(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM like_logs
     WHERE user_id = $1 AND instagram_account_id = $2
     AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [userId, instagramAccountId]
  );

  return result.rows.map((row: any) => ({
    date: row.date,
    count: parseInt(row.count),
  }));
};
