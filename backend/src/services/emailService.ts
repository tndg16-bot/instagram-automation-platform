import { query } from '../config/database';

/**
 * Email Service Manager
 * Handles email provider selection, sending, and retry logic
 */
class EmailServiceManager {
  private maxRetries = 3;
  private retryDelays = [60000, 120000, 300000]; // 1min, 2min, 5min

  /**
   * Send email with retry logic
   */
  async sendEmail(provider: any, to: string, subject: string, html: string, text: string, metadata: any): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        let result;

        // Send based on provider type
        switch (provider.type) {
          case 'sendgrid':
            const SendGridService = (await import('./sendGridService')).default;
            result = await SendGridService.sendEmail(provider.api_key, to, subject, html, text);
            break;

          case 'mailgun':
            const MailgunService = (await import('./mailgunService')).default;
            const config = provider.config || {};
            result = await MailgunService.sendEmail(provider.api_key, config.domain, to, subject, html, text);
            break;

          case 'ses':
            // TODO: Implement AWS SES
            throw new Error('AWS SES not yet implemented');

          case 'custom':
            // TODO: Implement custom SMTP
            throw new Error('Custom SMTP not yet implemented');

          default:
            throw new Error(`Unknown email provider: ${provider.type}`);
        }

        // Log successful send
        if (result.success) {
          await query(
            `INSERT INTO email_logs (provider_id, to_email, subject, status, created_at)
             VALUES ($1, $2, $3, 'sent', CURRENT_TIMESTAMP)
             RETURNING *`,
            [provider.id, to, subject]
          );

          return result;
        }

        lastError = new Error(result.error || result.message || 'Unknown error');

        // If not last attempt, wait before retry
        if (attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt - 1];
          console.log(`Send attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error: any) {
        lastError = error;
        console.error(`Send attempt ${attempt} failed:`, error);

        // If not last attempt, wait before retry
        if (attempt < this.maxRetries) {
          const delay = this.retryDelays[attempt - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    await query(
      `INSERT INTO email_logs (provider_id, to_email, subject, status, error_message, created_at)
       VALUES ($1, $2, $3, 'failed', $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [provider.id, to, subject, lastError.message]
    );

    // Log failure
    await query(
      `UPDATE email_providers
       SET total_failed = total_failed + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [provider.id]
    );

    throw lastError;
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get provider with retry config
   */
  async getProviderWithRetryConfig(providerId: string): Promise<any> {
    const result = await query(
      'SELECT * FROM email_providers WHERE id = $1',
      [providerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Email provider not found');
    }

    const provider = result.rows[0];

    // Add retry config from provider settings
    const retryConfig = provider.config || {};
    const config = {
      ...provider,
      retry_config: {
        max_retries: retryConfig.max_retries || this.maxRetries,
        retry_delay: retryConfig.retry_delay || 60000,
      },
    };

    return config;
  }
}

export default new EmailServiceManager();
