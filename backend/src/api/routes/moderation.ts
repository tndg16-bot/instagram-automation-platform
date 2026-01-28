import { Router, Request, Response } from 'express';
import { query } from '../../config/database';
import membershipService from '../../services/membershipService';

const router = Router();

/**
 * AI Moderation and Welcome Message endpoints
 */

// POST /api/moderation/check - Check content moderation
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const result = await query(
      `SELECT * FROM moderation_history 
       WHERE content_hash = encode(digest($1, 'sha256')) 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [content]
    );

    // Simple moderation rules
    const toxicKeywords = ['hate', 'violence', 'abuse', 'spam', 'scam'];
    let isFlagged = false;
    let toxicityScore = 0;

    const lowerContent = content.toLowerCase();
    for (const keyword of toxicKeywords) {
      if (lowerContent.includes(keyword)) {
        isFlagged = true;
        toxicityScore += 0.3;
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7) {
      isFlagged = true;
      toxicityScore += 0.2;
    }

    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/\S+/g) || []).length;
    if (linkCount > 3) {
      isFlagged = true;
      toxicityScore += 0.3;
    }

    // Store moderation result
    await query(
      `INSERT INTO moderation_history (content, content_hash, is_flagged, toxicity_score, created_at)
       VALUES ($1, encode(digest($1, 'sha256')), $2, $3, $4, NOW())`,
      [content, isFlagged, Math.min(toxicityScore, 1.0)]
    );

    res.json({
      success: true,
      data: {
        is_flagged: isFlagged,
        toxicity_score: Math.min(toxicityScore, 1.0),
        action: isFlagged ? 'review' : 'allow',
      },
    });
  } catch (error: any) {
    console.error('Moderation check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check moderation' });
  }
});

// POST /api/welcome/send - Send welcome message to new followers
router.post('/welcome/send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { follower_ids, message, template_id } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!follower_ids || !Array.isArray(follower_ids) || follower_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'follower_ids is required' });
    }

    // Get welcome message from template or use custom
    let welcomeMessage = message;
    if (template_id) {
      const templateResult = await query(
        'SELECT * FROM dm_message_templates WHERE id = $1 AND user_id = $2',
        [template_id, userId]
      );

      if (templateResult.rows.length > 0) {
        welcomeMessage = templateResult.rows[0].message;
      }
    }

    // Rate limiting check (max 50 welcome messages per hour)
    const rateLimitResult = await query(
      `SELECT COUNT(*) as count 
       FROM welcome_logs 
       WHERE sender_id = $1 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );

    const messageCount = parseInt(rateLimitResult.rows[0].count || '0');
    if (messageCount + follower_ids.length > 50) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded. Maximum 50 welcome messages per hour.' 
      });
    }

    // Send welcome messages
    const results = await Promise.all(
      follower_ids.map(async (followerId: string) => {
        try {
          // Check if already sent welcome to this follower
          const existingResult = await query(
            'SELECT * FROM welcome_logs WHERE sender_id = $1 AND recipient_id = $2',
            [userId, followerId]
          );

          if (existingResult.rows.length > 0) {
            return {
              success: false,
              recipient_id: followerId,
              reason: 'Already sent welcome message',
            };
          }

          // In production, this would call Instagram API
          // For now, just log it
          await query(
            `INSERT INTO welcome_logs (sender_id, recipient_id, message, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [userId, followerId, welcomeMessage || 'Welcome!']
          );

          return {
            success: true,
            recipient_id: followerId,
          };
        } catch (error: any) {
          console.error('Error sending welcome message:', error);
          return {
            success: false,
            recipient_id: followerId,
            reason: error.message,
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        total: follower_ids.length,
        success: successCount,
        failed: failCount,
        results,
      },
    });
  } catch (error: any) {
    console.error('Welcome message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send welcome message' });
  }
});

// GET /api/welcome/templates - List welcome message templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT * FROM dm_message_templates 
       WHERE user_id = $1 
       AND category = 'welcome'
       ORDER BY usage_count DESC, created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error getting welcome templates:', error);
    res.status(500).json({ success: false, error: 'Failed to get welcome templates' });
  }
});

// POST /api/welcome/templates - Create welcome template
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, message, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!name || !message) {
      return res.status(400).json({ success: false, error: 'Name and message are required' });
    }

    const result = await query(
      `INSERT INTO dm_message_templates (user_id, name, message, message_type, category, tags, created_at)
       VALUES ($1, $2, $3, 'TEXT', 'welcome', $4, NOW())
       RETURNING *`,
      [userId, name, message, tags || '[]']
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating welcome template:', error);
    res.status(500).json({ success: false, error: 'Failed to create welcome template' });
  }
});

export default router;
