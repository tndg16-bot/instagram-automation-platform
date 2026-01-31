import { query } from '../config/database';
import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
}

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000]; // Exponential backoff

/**
 * Generate HMAC signature for webhook payload
 */
export const generateSignature = (payload: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

/**
 * Send webhook to endpoint
 */
export const sendWebhook = async (
  url: string,
  payload: WebhookPayload,
  secret: string,
  timeout: number = 30000
): Promise<WebhookDeliveryResult> => {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, secret);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'InstaFlow-Webhook/1.0'
      },
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.substring(0, 1000) // Limit stored response size
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message
    };
  }
};

/**
 * Deliver webhook with retry logic
 */
export const deliverWebhookWithRetry = async (
  endpointId: string,
  payload: WebhookPayload
): Promise<WebhookDeliveryResult> => {
  // Get endpoint details
  const endpointResult = await query(
    'SELECT * FROM webhook_endpoints WHERE id = $1 AND is_active = TRUE',
    [endpointId]
  );

  if (endpointResult.rows.length === 0) {
    return { success: false, error: 'Endpoint not found or inactive' };
  }

  const endpoint = endpointResult.rows[0];

  let lastResult: WebhookDeliveryResult = { success: false };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    lastResult = await sendWebhook(endpoint.url, payload, endpoint.secret_key);

    // Log the attempt
    await query(
      `INSERT INTO webhook_logs (endpoint_id, event_type, payload, response_status, response_body, retry_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        endpointId,
        payload.event,
        payload,
        lastResult.statusCode,
        lastResult.responseBody || lastResult.error,
        attempt
      ]
    );

    if (lastResult.success) {
      return lastResult;
    }

    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  return lastResult;
};

/**
 * Trigger webhooks for an event
 */
export const triggerWebhooks = async (
  userId: string,
  event: string,
  data: any
): Promise<void> => {
  try {
    // Get all active endpoints for this user that subscribe to this event
    const endpointsResult = await query(
      `SELECT id FROM webhook_endpoints 
       WHERE user_id = $1 
       AND is_active = TRUE 
       AND $2 = ANY(events)`,
      [userId, event]
    );

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    // Send to all endpoints (don't await, fire and forget)
    for (const endpoint of endpointsResult.rows) {
      deliverWebhookWithRetry(endpoint.id, payload).catch(err => {
        console.error(`Webhook delivery failed for endpoint ${endpoint.id}:`, err);
      });
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
};

/**
 * Process pending webhooks (for cron job)
 */
export const processPendingWebhooks = async (batchSize: number = 100): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> => {
  // This function can be used for a cron job to retry failed webhooks
  // For now, webhooks are sent immediately with retry logic
  return { processed: 0, succeeded: 0, failed: 0 };
};
