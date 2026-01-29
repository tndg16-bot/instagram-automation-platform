import fetch from 'node-fetch';
import { query } from '../config/database';

/**
 * Mailgun Email Service
 */
class MailgunService {
  async sendEmail(apiKey: string, domain: string, to: string, subject: string, html: string, text: string): Promise<any> {
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'InstaFlow AI <noreply@instaflow.ai>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    });

    const data = await response.json();

    if (response.ok || data.message === 'Queued. Thank you.') {
      return {
        success: true,
        provider: 'mailgun',
        message_id: data.id,
        response: data,
      };
    } else {
      throw new Error(data.message || 'Mailgun API error');
    }
  }
}

export default new MailgunService();
