import { query } from '../config/database';
import InstagramGraphClient from './instagramClient';

export interface ScheduledPost {
  id: string;
  user_id: string;
  instagram_account_id: string;
  caption: string;
  media_type: 'image' | 'video' | 'carousel' | 'story' | 'reel';
  media_urls: string[];
  scheduled_at: Date;
  status: 'pending' | 'processing' | 'published' | 'failed';
  published_at?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateScheduledPostDto {
  caption: string;
  media_type: 'image' | 'video' | 'carousel' | 'story' | 'reel';
  media_urls: string[];
  scheduled_at: Date;
}

/**
 * Create scheduled post
 */
export const createScheduledPost = async (
  userId: string,
  instagramAccountId: string,
  dto: CreateScheduledPostDto
): Promise<ScheduledPost> => {
  const result = await query(
    `INSERT INTO scheduled_posts 
     (user_id, instagram_account_id, caption, media_type, media_urls, scheduled_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [userId, instagramAccountId, dto.caption, dto.media_type, JSON.stringify(dto.media_urls), dto.scheduled_at]
  );

  return result.rows[0];
};

/**
 * Get scheduled posts
 */
export const getScheduledPosts = async (
  userId: string,
  instagramAccountId: string,
  status?: string
): Promise<ScheduledPost[]> => {
  let sql = 'SELECT * FROM scheduled_posts WHERE user_id = $1 AND instagram_account_id = $2';
  const params: any[] = [userId, instagramAccountId];

  if (status) {
    sql += ' AND status = $3';
    params.push(status);
  }

  sql += ' ORDER BY scheduled_at DESC';

  const result = await query(sql, params);
  return result.rows.map(row => ({
    ...row,
    media_urls: Array.isArray(row.media_urls) ? row.media_urls : JSON.parse(row.media_urls || '[]')
  }));
};

/**
 * Delete scheduled post
 */
export const deleteScheduledPost = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'DELETE FROM scheduled_posts WHERE id = $1 AND user_id = $2 AND status = $3 RETURNING id',
    [postId, userId, 'pending']
  );

  return result.rows.length > 0;
};

/**
 * Process pending scheduled posts
 */
export const processScheduledPosts = async (
  batchSize: number = 10
): Promise<{ processed: number; succeeded: number; failed: number }> => {
  // Get pending posts that are due
  const pendingResult = await query(
    `SELECT sp.*, ia.access_token 
     FROM scheduled_posts sp
     JOIN instagram_accounts ia ON sp.instagram_account_id = ia.id
     WHERE sp.status = 'pending' AND sp.scheduled_at <= NOW()
     ORDER BY sp.scheduled_at ASC
     LIMIT $1`,
    [batchSize]
  );

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const post of pendingResult.rows) {
    processed++;

    try {
      // Mark as processing
      await query(
        "UPDATE scheduled_posts SET status = 'processing' WHERE id = $1",
        [post.id]
      );

      const client = new InstagramGraphClient(post.access_token);
      const mediaUrls = Array.isArray(post.media_urls) 
        ? post.media_urls 
        : JSON.parse(post.media_urls || '[]');

      let publishedId: string | null = null;

      switch (post.media_type) {
        case 'image':
          if (mediaUrls.length === 1) {
            const containerId = await client.postMedia(mediaUrls[0], post.caption);
            publishedId = await client.publishMedia(containerId);
          }
          break;

        case 'carousel':
          if (mediaUrls.length > 1) {
            const childIds: string[] = [];
            for (const url of mediaUrls) {
              const childId = await client.postMedia(url, '');
              childIds.push(childId);
            }
            const carouselId = await client.createCarouselContainer(childIds, post.caption);
            publishedId = await client.publishMedia(carouselId);
          }
          break;

        case 'story':
          if (mediaUrls.length === 1) {
            publishedId = await client.postStory(mediaUrls[0]);
          }
          break;

        case 'reel':
          if (mediaUrls.length === 1) {
            publishedId = await client.postReel(mediaUrls[0], post.caption);
          }
          break;

        case 'video':
          if (mediaUrls.length === 1) {
            const containerId = await client.postMedia(mediaUrls[0], post.caption);
            publishedId = await client.publishMedia(containerId);
          }
          break;
      }

      if (publishedId) {
        await query(
          `UPDATE scheduled_posts 
           SET status = 'published', published_at = NOW(), error_message = NULL 
           WHERE id = $1`,
          [post.id]
        );
        succeeded++;
      } else {
        throw new Error('Failed to publish post');
      }
    } catch (error: any) {
      await query(
        `UPDATE scheduled_posts 
         SET status = 'failed', error_message = $1 
         WHERE id = $2`,
        [error.message, post.id]
      );
      failed++;
    }
  }

  return { processed, succeeded, failed };
};
