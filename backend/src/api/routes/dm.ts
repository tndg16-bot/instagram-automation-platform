import express, { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import dmCampaignService from '../../services/dmCampaignService';
import InstagramGraphClient from '../../services/instagramClient';
import dmBroadcastEngine from '../../services/dmBroadcastEngine';
import dmStepSequenceService from '../../services/dmStepSequenceService';

const router = Router();

router.use(authenticate);

router.post('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { instagram_account_id, name, message, message_type, media_url, segment_id, scheduled_at, recipients } = req.body;

    if (!instagram_account_id || !name || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const campaign = await dmCampaignService.createCampaign({
      user_id: userId,
      instagram_account_id,
      name,
      message,
      message_type,
      media_url,
      segment_id,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
    });

    if (recipients && Array.isArray(recipients)) {
      for (const recipient of recipients) {
        await dmCampaignService.addRecipientToCampaign({
          campaign_id: campaign.id,
          recipient_id: recipient.id,
          recipient_username: recipient.username,
        });
      }

      await dmCampaignService.updateCampaignStats(campaign.id, {
        total_recipients: recipients.length,
      });
    }

    res.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('Error creating DM campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const campaigns = await dmCampaignService.getCampaignsByUserId(userId);
    res.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error('Error fetching DM campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;
    const userId = req.user!.id;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recipients = await dmCampaignService.getCampaignRecipients(campaignId);

    res.json({
      success: true,
      campaign: {
        ...campaign,
        recipients,
      },
    });
  } catch (error) {
    console.error('Error fetching DM campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns/:id/send', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;
    const userId = req.user!.id;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return res.status(400).json({ error: 'Campaign already sent or in progress' });
    }

    dmBroadcastEngine.executeCampaign(campaignId).catch(err => {
      console.error('Campaign execution error:', err);
    });

    res.json({
      success: true,
      message: 'Campaign execution started',
      campaign_id: campaignId,
    });
  } catch (error) {
    console.error('Error sending DM campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/campaigns/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;
    const userId = req.user!.id;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (campaign.status === 'sending') {
      return res.status(400).json({ error: 'Cannot delete sending campaign' });
    }

    await dmCampaignService.updateCampaignStatus(campaignId, 'deleted');

    res.json({
      success: true,
      message: 'Campaign deleted',
    });
  } catch (error) {
    console.error('Error deleting DM campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/segments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { instagram_account_id, name, description, conditions, is_dynamic } = req.body;

    if (!instagram_account_id || !name || !conditions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const segment = await dmCampaignService.createSegment({
      user_id: userId,
      instagram_account_id,
      name,
      description,
      conditions,
      is_dynamic,
    });

    res.json({
      success: true,
      segment,
    });
  } catch (error) {
    console.error('Error creating DM segment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/segments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const segments = await dmCampaignService.getSegmentsByUserId(userId);
    res.json({
      success: true,
      segments,
    });
  } catch (error) {
    console.error('Error fetching DM segments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, message, message_type, media_url, category, tags } = req.body;

    if (!name || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const template = await dmCampaignService.createTemplate({
      user_id: userId,
      name,
      message,
      message_type,
      media_url,
      category,
      tags,
    });

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error creating DM template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templates = await dmCampaignService.getTemplatesByUserId(userId);
    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error fetching DM templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns/:id/steps', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { step_order, message, media_url, delay_hours, trigger_condition } = req.body;

    if (step_order === undefined || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const step = await dmStepSequenceService.createStep({
      campaign_id: campaignId,
      step_order,
      message,
      media_url,
      delay_hours,
      trigger_condition,
    });

    res.json({
      success: true,
      step,
    });
  } catch (error) {
    console.error('Error creating DM step:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/campaigns/:id/steps', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const steps = await dmStepSequenceService.getStepsByCampaignId(campaignId);

    res.json({
      success: true,
      steps,
    });
  } catch (error) {
    console.error('Error fetching DM steps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/campaigns/:id/steps/:stepId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, stepId } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;
    const stepIdStr = Array.isArray(stepId) ? stepId[0] : stepId;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { step_order, message, media_url, delay_hours, trigger_condition } = req.body;

    const step = await dmStepSequenceService.updateStep(stepIdStr, {
      step_order,
      message,
      media_url,
      delay_hours,
      trigger_condition,
    });

    res.json({
      success: true,
      step,
    });
  } catch (error) {
    console.error('Error updating DM step:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/campaigns/:id/steps/:stepId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, stepId } = req.params;
    const campaignId = Array.isArray(id) ? id[0] : id;
    const stepIdStr = Array.isArray(stepId) ? stepId[0] : stepId;

    const campaign = await dmCampaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await dmStepSequenceService.deleteStep(stepIdStr);

    res.json({
      success: true,
      message: 'Step deleted',
    });
  } catch (error) {
    console.error('Error deleting DM step:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
