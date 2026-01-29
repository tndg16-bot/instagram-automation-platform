import fetch from 'node-fetch';
import { query } from '../config/database';

/**
 * SendGrid Email Service
 */
class SendGridService {
  async sendEmail(apiKey: string, to: string, subject: string, html: string, text: string): Promise<any> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: to,
            subject: subject,
            from: 'InstaFlow AI <noreply@instaflow.ai>',
            content: html ? [{
              type: 'text/html',
              value: html,
            }] : [{
              type: 'text/plain',
              value: text,
            }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        provider: 'sendgrid',
        message_id: data.messageId,
        response: data,
      };
    } else {
      throw new Error(data.errors?.[0]?.message || 'SendGrid API error');
    }
  }
}

export default new SendGridService();
