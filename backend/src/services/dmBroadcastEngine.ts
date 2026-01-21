import InstagramGraphClient from './instagramClient';
import dmCampaignService from './dmCampaignService';
import { query } from '../config/database';

interface DMSendResult {
  success: boolean;
  recipientId: string;
  error?: string;
}

class DMBroadcastEngine {
  private activeCampaigns: Set<string> = new Set();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  async executeCampaign(campaignId: string): Promise<void> {
    if (this.activeCampaigns.has(campaignId)) {
      throw new Error('Campaign is already being executed');
    }

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign is not in a valid state for execution');
    }

    this.activeCampaigns.add(campaignId);

    try {
      await dmCampaignService.updateCampaignStatus(campaignId, 'sending');

      await query(
        'UPDATE dm_campaigns SET started_at = NOW() WHERE id = $1',
        [campaignId]
      );

      const recipients = await dmCampaignService.getCampaignRecipients(campaignId);
      const totalRecipients = recipients.length;

      await dmCampaignService.updateCampaignStats(campaignId, { total_recipients: totalRecipients });

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          await this.checkRateLimit(campaign.instagram_account_id);
          await this.sendDM(campaign, recipient.recipient_id);

          await dmCampaignService.updateRecipientStatus(recipient.id, 'sent');
          sentCount++;

          await dmCampaignService.updateCampaignStats(campaignId, { sent_count: sentCount });

          await dmCampaignService.logDMActivity({
            user_id: campaign.user_id,
            instagram_account_id: campaign.instagram_account_id,
            campaign_id: campaignId,
            recipient_id: recipient.recipient_id,
            action: 'sent',
            details: { recipient_username: recipient.recipient_username },
          });

          await this.delay(1000 + Math.random() * 2000);
        } catch (error: any) {
          failedCount++;

          await dmCampaignService.updateRecipientStatus(recipient.id, 'failed', error.message);

          await dmCampaignService.updateCampaignStats(campaignId, { failed_count: failedCount });

          await dmCampaignService.logDMActivity({
            user_id: campaign.user_id,
            instagram_account_id: campaign.instagram_account_id,
            campaign_id: campaignId,
            recipient_id: recipient.recipient_id,
            action: 'failed',
            details: { error: error.message, recipient_username: recipient.recipient_username },
          });

          if (error.message?.includes('rate limit')) {
            await this.delay(60000);
          }
        }
      }

      const finalStatus = failedCount > 0 ? 'completed' : 'completed';
      await dmCampaignService.updateCampaignStatus(campaignId, finalStatus);

      await query(
        'UPDATE dm_campaigns SET completed_at = NOW() WHERE id = $1',
        [campaignId]
      );
    } finally {
      this.activeCampaigns.delete(campaignId);
    }
  }

  private async sendDM(campaign: any, recipientId: string): Promise<void> {
    const accessToken = await this.getAccessToken(campaign.instagram_account_id);

    const client = new InstagramGraphClient(accessToken);

    await client.sendDM(recipientId, campaign.message, campaign.media_url);
  }

  private async getAccessToken(instagramAccountId: string): Promise<string> {
    const result = await query(
      'SELECT access_token FROM instagram_accounts WHERE id = $1',
      [instagramAccountId]
    );

    if (result.rows.length === 0) {
      throw new Error('Instagram account not found');
    }

    return result.rows[0].access_token;
  }

  private async checkRateLimit(instagramAccountId: string): Promise<void> {
    const now = Date.now();
    const window = 60 * 60 * 1000;
    const maxRequests = 50;

    let limit = this.rateLimits.get(instagramAccountId);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(instagramAccountId, {
        count: 1,
        resetTime: now + window,
      });
      return;
    }

    if (limit.count >= maxRequests) {
      const waitTime = limit.resetTime - now;
      if (waitTime > 0) {
        await this.delay(waitTime);
      }

      this.rateLimits.set(instagramAccountId, {
        count: 0,
        resetTime: now + window,
      });
    } else {
      limit.count++;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkScheduledCampaigns(): Promise<void> {
    const now = new Date();

    const result = await query(
      `SELECT * FROM dm_campaigns
       WHERE status = 'scheduled'
       AND scheduled_at <= $1
       AND id NOT IN (SELECT unnest($2::uuid[]))`,
      [now, Array.from(this.activeCampaigns)]
    );

    for (const campaign of result.rows) {
      this.executeCampaign(campaign.id).catch(error => {
        console.error('Error executing scheduled campaign:', error);
      });
    }
  }

  startScheduler(intervalMs: number = 60000): void {
    setInterval(() => {
      this.checkScheduledCampaigns().catch(error => {
        console.error('Error in campaign scheduler:', error);
      });
    }, intervalMs);
  }
}

export default new DMBroadcastEngine();
