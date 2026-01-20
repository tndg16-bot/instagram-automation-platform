import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config';

interface InstagramConfig {
  accessToken: string;
  baseUrl: string;
}

class InstagramGraphClient {
  private client: AxiosInstance;

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

  private handleError(error: any, operation: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

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
      }
    } else {
      console.error(`Unexpected error [${operation}]:`, error);
    }
  }
}

export default InstagramGraphClient;
