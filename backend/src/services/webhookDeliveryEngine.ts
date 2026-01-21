import axios from 'axios';
import webhookService from './webhookService';

const MAX_RETRIES = 5;
const WEBHOOK_TIMEOUT_MS = 30000; // 30秒

interface Webhook {
  id?: string;
  url: string;
  secret: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, any>;
}

/**
 * Webhook delivery engine with retry logic
 */
class WebhookDeliveryEngine {
  /**
   * Deliver webhook with exponential backoff retry
   */
  async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    logId: string,
    attempt: number = 0
  ): Promise<void> {
    try {
      // Generate signature
      const payload = JSON.stringify(event);
      const signature = webhookService.generateSignature(payload, webhook.secret);
      const timestamp = Date.now().toString();

      // Send webhook request
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-ID': event.id,
        },
        timeout: WEBHOOK_TIMEOUT_MS,
        validateStatus: (status) => status < 500, // 5xx以外は成功として扱う（再試行しない）
      });

      // Success (2xx or 3xx)
      if (response.status >= 200 && response.status < 400) {
        await webhookService.updateWebhookLog(logId, {
          status: 'success',
          response_status: response.status,
          response_body: JSON.stringify(response.data),
          completed_at: new Date(),
        });
        console.log(`Webhook delivered successfully: ${webhook.url}`);
        return;
      }

      // Client error (4xx) - no retry
      if (response.status >= 400 && response.status < 500) {
        await webhookService.updateWebhookLog(logId, {
          status: 'failed',
          response_status: response.status,
          error_message: `Client error: ${response.statusText}`,
          completed_at: new Date(),
        });
        console.error(`Webhook failed (4xx): ${webhook.url} - ${response.status}`);
        return;
      }

      // Server error (5xx) - will retry
      throw new Error(`Server error: ${response.status} ${response.statusText}`);

    } catch (error: any) {
      const isRetryable = this.isRetryableError(error, attempt);

      if (attempt >= MAX_RETRIES - 1 || !isRetryable) {
        // Max retries reached or non-retryable error
        await webhookService.updateWebhookLog(logId, {
          status: 'failed',
          error_message: error.message || 'Unknown error',
          completed_at: new Date(),
        });
        console.error(`Webhook failed after ${attempt + 1} attempts: ${webhook.url}`);
        return;
      }

      // Retry with exponential backoff
      const delay = this.calculateBackoffDelay(attempt);
      await webhookService.updateWebhookLog(logId, {
        status: 'retrying',
        retry_count: attempt + 1,
      });
      console.log(`Webhook retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms: ${webhook.url}`);

      await this.sleep(delay);
      return this.deliverWebhook(webhook, event, logId, attempt + 1);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, attempt: number): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // HTTP errors (5xx)
    if (error.response && error.response.status >= 500) {
      return true;
    }

    // Rate limit (429) - retry with longer delay
    if (error.response && error.response.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: 1min, 5min, 15min, 30min
    const baseDelay = 60000; // 1分
    const delays = [1, 5, 15, 30, 60]; // 分単位
    return Math.min(delays[attempt] || 60, 60) * 1000; // 最大60分
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new WebhookDeliveryEngine();
