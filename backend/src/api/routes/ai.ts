import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import aiService from '../../services/aiService';

const router = Router();

router.post(
  '/generate-caption',
  [
    body('keywords')
      .isArray({ min: 1 })
      .withMessage('Keywords must be a non-empty array'),
    body('keywords.*')
      .trim()
      .notEmpty()
      .withMessage('Each keyword must not be empty'),
    body('tone')
      .optional()
      .isIn(['friendly', 'professional', 'casual', 'humorous', 'inspiring'])
      .withMessage('Invalid tone. Must be: friendly, professional, casual, humorous, inspiring'),
    body('maxLength')
      .optional()
      .isInt({ min: 1, max: 2200 })
      .withMessage('Max length must be between 1 and 2200'),
    body('includeHashtags')
      .optional()
      .isBoolean()
      .withMessage('Include hashtags must be a boolean'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      const { keywords, tone, maxLength, includeHashtags } = req.body;

      const caption = await aiService.generateCaption({
        keywords,
        tone: tone || 'friendly',
        maxLength: maxLength || 500,
        includeHashtags: includeHashtags !== undefined ? includeHashtags : true,
      });

      res.status(200).json({
        success: true,
        data: caption,
      });
    } catch (error: any) {
      console.error('Caption generation error:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate caption',
      });
    }
  }
);

router.post(
  '/generate-multiple',
  [
    body('keywords')
      .isArray({ min: 1 })
      .withMessage('Keywords must be a non-empty array'),
    body('keywords.*')
      .trim()
      .notEmpty()
      .withMessage('Each keyword must not be empty'),
    body('tone')
      .optional()
      .isIn(['friendly', 'professional', 'casual', 'humorous', 'inspiring'])
      .withMessage('Invalid tone'),
    body('count')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Count must be between 1 and 10'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      const { keywords, tone, count } = req.body;

      const captions = await aiService.generateMultipleCaptions(
        {
          keywords,
          tone: tone || 'friendly',
        },
        count || 3
      );

      res.status(200).json({
        success: true,
        data: captions,
      });
    } catch (error: any) {
      console.error('Multiple caption generation error:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate captions',
      });
    }
  }
);

router.post(
  '/analyze-caption',
  [
    body('caption')
      .trim()
      .notEmpty()
      .withMessage('Caption is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    try {
      const { caption } = req.body;

      const analysis = await aiService.analyzeCaptionPerformance(caption);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      console.error('Caption analysis error:', error);

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze caption',
      });
    }
  }
);

export default router;
