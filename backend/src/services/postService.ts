import pool from '../config/database';
import InstagramGraphClient from './instagramClient';
import { getInstagramAccessToken } from '../utils/tokenManager';

interface ScheduledPost {
  id: string;
  user_id: string;
  instagram_account_id: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_urls: any;
  caption: string | null;
  carousel_id: string | null;
  container_id: string | null;
  scheduled_at: Date | null;
  instagram_media_id: string | null;
  permalink: string | null;
  error_message: string | null;
  retry_count: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface PostTemplate {
  id: string;
  user_id: string;
  template_name: string;
  caption: string | null;
  media_urls: any;
  is_active: boolean;
}

class PostService {
  /**
   * Create draft post
   */
  async createDraftPost(
    userId: string,
    instagramAccountId: string,
    mediaType: string,
    mediaUrls: any[],
    caption: string | null
  ): Promise<ScheduledPost> {
    const query = `
      INSERT INTO scheduled_posts (
        user_id,
        instagram_account_id,
        status,
        media_type,
        media_urls,
        caption
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const params = [
      userId,
      instagramAccountId,
      'draft',
      mediaType,
      JSON.stringify(mediaUrls),
      caption,
    ];

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Schedule post for future date
   */
  async schedulePost(
    postId: string,
    scheduledAt: Date
  ): Promise<void> {
    const query = `
      UPDATE scheduled_posts
      SET status = 'scheduled',
          scheduled_at = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;

    await pool.query(query, [postId, scheduledAt]);
  }

  /**
   * Publish post immediately
   */
  async publishPost(postId: string): Promise<string> {
    // Get post details
    const post = await this.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const accessToken = await getInstagramAccessToken(post.user_id, post.instagram_account_id);
    const client = new InstagramGraphClient(accessToken);
    let mediaId: string | null = null;
    let publishedId: string | null = null;

    try {
      // Mark as publishing
      await this.updatePostStatus(postId, 'publishing');

      if (post.media_type === 'IMAGE') {
        // Create media container and publish
        mediaId = await client.postMedia(String(post.media_urls[0]), post.caption || '');
        publishedId = await client.publishMedia(mediaId!);

        await pool.query(
          `UPDATE scheduled_posts SET container_id = $2, instagram_media_id = $3, status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [postId, mediaId, publishedId]
        );
      } else if (post.media_type === 'CAROUSEL_ALBUM') {
        // Create individual media containers
        const mediaIds: string[] = [];
        for (const url of post.media_urls) {
          const id = await client.postMedia(url, '');
          mediaIds.push(id);
        }

        // Create carousel container
        const carouselId = await client.createCarouselContainer(mediaIds, post.caption || '');

        // Publish carousel
        publishedId = await client.publishMedia(carouselId);

        await pool.query(
          `UPDATE scheduled_posts SET carousel_id = $2, container_id = $3, instagram_media_id = $4, status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [postId, carouselId || null, publishedId]
        );
      } else if (post.media_type === 'VIDEO') {
        // Create video container
        mediaId = await client.postMedia(String(post.media_urls[0]), post.caption || '');

        // Wait for video processing (polling)
        await this.waitForVideoProcessing(mediaId!, accessToken!);

        // Publish when ready
        publishedId = await client.publishMedia(mediaId!);

        await pool.query(
          `UPDATE scheduled_posts SET container_id = $2, instagram_media_id = $3, status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [postId, mediaId, publishedId]
        );
      }

      return publishedId as string;
    } catch (error: any) {
      console.error('Error publishing post:', error);
      await this.updatePostStatus(postId, 'failed', error.response?.data?.error?.message || error.message);
      throw error;
    }
  }

  /**
   * Wait for video processing to complete
   */
  async waitForVideoProcessing(mediaId: string, accessToken: string, maxAttempts: number = 20): Promise<void> {
    const client = new InstagramGraphClient(accessToken);

    for (let i = 0; i < maxAttempts; i++) {
      const status = await client.getMediaStatus(mediaId);
      if (status === 'FINISHED') {
        return;
      }

      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    throw new Error('Video processing timeout');
  }

  /**
   * Check for and publish scheduled posts
   */
  async checkAndPublishScheduledPosts(): Promise<number> {
    const query = `
      SELECT * FROM scheduled_posts
      WHERE status = 'scheduled'
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 10;
    `;

    const result = await pool.query(query);
    const posts = result.rows;
    let publishedCount = 0;

    for (const post of posts) {
      try {
        await this.publishPost(post.id);
        publishedCount++;
      } catch (error) {
        console.error(`Failed to publish scheduled post ${post.id}:`, error);
      }
    }

    return publishedCount;
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: string): Promise<ScheduledPost | null> {
    const query = `
      SELECT * FROM scheduled_posts
      WHERE id = $1;
    `;

    const result = await pool.query(query, [postId]);
    return result.rows[0] || null;
  }

  /**
   * Get all posts for user
   */
  async getAllPosts(userId: string, limit: number = 50, offset: number = 0): Promise<ScheduledPost[]> {
    const query = `
      SELECT * FROM scheduled_posts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Update post status
   */
  async updatePostStatus(
    postId: string,
    status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const query = `
      UPDATE scheduled_posts
      SET status = $2,
          error_message = $3,
          retry_count = retry_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;

    await pool.query(query, [postId, status, errorMessage || null]);
  }

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<void> {
    const query = `
      DELETE FROM scheduled_posts
      WHERE id = $1;
    `;

    await pool.query(query, [postId]);
  }

  /**
   * Create post template
   */
  async createPostTemplate(
    userId: string,
    templateName: string,
    caption: string,
    mediaUrls: any[]
  ): Promise<PostTemplate> {
    const query = `
      INSERT INTO post_templates (user_id, template_name, caption, media_urls)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await pool.query(query, [userId, templateName, caption, JSON.stringify(mediaUrls)]);
    return result.rows[0];
  }

  /**
   * Get all post templates
   */
  async getAllPostTemplates(userId: string): Promise<PostTemplate[]> {
    const query = `
      SELECT * FROM post_templates
      WHERE user_id = $1 AND is_active = true
      ORDER BY template_name;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete post template
   */
  async deletePostTemplate(templateId: string): Promise<void> {
    const query = `
      DELETE FROM post_templates
      WHERE id = $1;
    `;

    await pool.query(query, [templateId]);
  }
}

export default PostService;
