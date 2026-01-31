import axios from 'axios';
import config from '../config';

interface InstagramConfig {
  accessToken: string;
  baseUrl: string;
}

class InstagramGraphClient {
  private client: any;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: config.instagram.graphApiBaseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getComments(mediaId: string) {
    try {
      const response = await this.client.get(`/${config.instagram.apiVersion}/${mediaId}/comments`);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getComments');
      throw error;
    }
  }

  async replyToComment(commentId: string, message: string) {
    try {
      await this.client.post(`/${config.instagram.apiVersion}/${commentId}/replies`, {
        message,
      });
    } catch (error) {
      this.handleError(error, 'replyToComment');
      throw error;
    }
  }

  async sendDM(recipientId: string, message: string, mediaUrl?: string) {
    try {
      const payload: any = {
        recipient: { id: recipientId },
        message: { text: message },
      };

      if (mediaUrl) {
        payload.message.attachment = {
          type: 'image',
          payload: { url: mediaUrl },
        };
      }

      await this.client.post(`/${config.instagram.apiVersion}/me/messages`, payload);
    } catch (error) {
      this.handleError(error, 'sendDM');
      throw error;
    }
  }

  async postMedia(imageUrl: string, caption: string) {
    try {
      const response = await this.client.post(`/${config.instagram.apiVersion}/me/media`, {
        image_url: imageUrl,
        caption,
      });
      return response.data.id;
    } catch (error) {
      this.handleError(error, 'postMedia');
      throw error;
    }
  }

  async publishMedia(containerId: string) {
    try {
      const response = await this.client.post(
        `/${config.instagram.apiVersion}/${containerId}/content_publish`,
        {}
      );
      return response.data.id;
    } catch (error) {
      this.handleError(error, 'publishMedia');
      throw error;
    }
  }

  async getMediaStatus(mediaId: string) {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/${mediaId}?fields=status_code`
      );
      return response.data.status_code;
    } catch (error) {
      this.handleError(error, 'getMediaStatus');
      throw error;
    }
  }

  async createCarouselContainer(childrenMediaIds: string[], caption: string) {
    try {
      const response = await this.client.post(
        `/${config.instagram.apiVersion}/me/media`,
        {
          media_type: 'CAROUSEL_ALBUM',
          children: childrenMediaIds.map((id) => ({ id })),
          caption,
        }
      );
      return response.data.id;
    } catch (error) {
      this.handleError(error, 'createCarouselContainer');
      throw error;
    }
  }

  async likeMedia(mediaId: string) {
    try {
      await this.client.post(`/${config.instagram.apiVersion}/${mediaId}/likes`);
    } catch (error) {
      this.handleError(error, 'likeMedia');
      throw error;
    }
  }

  async followUser(userId: string) {
    try {
      await this.client.post(`/${config.instagram.apiVersion}/me/following`, {
        user_id: userId,
      });
    } catch (error) {
      this.handleError(error, 'followUser');
      throw error;
    }
  }

  async unfollowUser(userId: string) {
    try {
      await this.client.delete(`/${config.instagram.apiVersion}/me/following`, {
        data: { user_id: userId },
      });
    } catch (error) {
      this.handleError(error, 'unfollowUser');
      throw error;
    }
  }

  async getAccountInfo() {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/me?fields=id,username,account_type,media_count,followers_count,follows_count`
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'getAccountInfo');
      throw error;
    }
  }

  async getFollowers(limit: number = 50) {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/me/followers?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getFollowers');
      throw error;
    }
  }

  async getFollowing(limit: number = 50) {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/me/following?limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getFollowing');
      throw error;
    }
  }

  async getRecentMedia(limit: number = 25) {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getRecentMedia');
      throw error;
    }
  }

  async postStory(imageUrl: string) {
    try {
      const response = await this.client.post(`/${config.instagram.apiVersion}/me/stories`, {
        image_url: imageUrl,
      });
      return response.data.id;
    } catch (error) {
      this.handleError(error, 'postStory');
      throw error;
    }
  }

  async postReel(videoUrl: string, caption: string) {
    try {
      const response = await this.client.post(`/${config.instagram.apiVersion}/me/reels`, {
        video_url: videoUrl,
        caption,
        share_to_feed: true,
      });
      return response.data.id;
    } catch (error) {
      this.handleError(error, 'postReel');
      throw error;
    }
  }

  async getUserMedia(userId: string, limit: number = 25) {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/${userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getUserMedia');
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 50) {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/ig_hashtag_search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'searchUsers');
      throw error;
    }
  }

  async getInsights(metric: string, period: string = 'day') {
    try {
      const response = await this.client.get(
        `/${config.instagram.apiVersion}/me/insights?metric=${metric}&period=${period}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getInsights');
      throw error;
    }
  }

  private handleError(error: any, operation: string): void {
    if (error && error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      console.error(`Instagram API Error [${operation}]:`, {
        status,
        data,
      });

      if (status === 429) {
        console.error('Rate limit exceeded. Please retry later.');
      }

      if (status === 401) {
        console.error('Authentication failed. Token may be expired.');
      }
    } else {
      console.error(`Unexpected error [${operation}]:`, error);
    }
  }
}

export default InstagramGraphClient;
