import express, { Router, Request, Response } from 'express';
import { query } from '../../config/database';
import workflowService from '../../services/workflowService';
import nlWorkflowGenerator from '../../services/nlWorkflowGenerator';
import aiDecisionEngine from '../../services/aiDecisionEngine';
import workflowOptimizer from '../../services/workflowOptimizer';
import workflowRecommendationEngine from '../../services/workflowRecommendationEngine';
import conversationContextEngine from '../../services/conversationContextEngine';

const router = Router();

// Create new workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    const workflow = await workflowService.createWorkflow(userId, req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (error: any) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all workflows
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    const workflows = await workflowService.getWorkflows(userId);
    res.json({ success: true, data: workflows });
  } catch (error: any) {
    console.error('Get workflows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get workflow by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id as string);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    console.error('Get workflow detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update workflow
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id';
    const workflow = await workflowService.updateWorkflow(req.params.id as string, userId, req.body);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or unauthorized' });
    }
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete workflow
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id';
    const success = await workflowService.deleteWorkflow(req.params.id as string, userId);
    if (!success) {
      return res.status(404).json({ error: 'Workflow not found or unauthorized' });
    }
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error: any) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute workflow (Placeholder for now)
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Implement execution engine
    res.json({
      success: true,
      message: `Workflow ${id} execution started (Mock)`,
      executionId: `exec-${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Phase A: Natural Language Workflow Generation
// ============================================

// Generate workflow from natural language
router.post('/generate-from-nl', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    const { description, language, targetPlatform, includeAI, aiModel, conversationContext } = req.body;

    const result = await nlWorkflowGenerator.generateFromNL(description, {
      userId,
      language: language || 'ja',
      workflowName: req.body.workflowName,
      instagramAccountId: req.body.instagramAccountId,
      includeAI: includeAI ?? true,
      aiModel,
      conversationContext
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Generate workflow from NL error:', error);
    res.status(500).json({ error: 'Failed to generate workflow' });
  }
});

// Get NL generation history
router.get('/generations', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    const result = await query(
      'SELECT * FROM nl_workflow_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get NL generations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get NL generation by ID
router.get('/generations/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM nl_workflow_generations WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (error: any) {
    console.error('Get NL generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark NL generation as applied
router.post('/generations/:id/apply', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    await query(
      'UPDATE nl_workflow_generations SET applied = true WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    res.json({ success: true, message: 'Workflow applied' });
  } catch (error: any) {
    console.error('Apply NL generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// AI Decision Engine Endpoints
// ============================================

// Make AI decision
router.post('/ai-decisions/make', async (req: Request, res: Response) => {
  try {
    // TODO: Implement AI decision engine
    res.json({
      success: true,
      message: 'AI decision endpoint - To be implemented'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit AI decision feedback
router.post('/ai-decisions/feedback', async (req: Request, res: Response) => {
  try {
    const { decisionId, userCorrection, actualOutcome, metrics } = req.body;
    const result = await query(
      `INSERT INTO ai_decision_feedback (decision_id, user_correction, actual_outcome, metrics, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [decisionId, userCorrection, actualOutcome, JSON.stringify(metrics)]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Submit AI decision feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI decision history
router.get('/ai-decisions/history', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    const result = await query(
      'SELECT * FROM ai_decisions JOIN ai_decision_feedback ON ai_decisions.id = ai_decision_feedback.decision_id WHERE ai_decisions.user_id = $1 ORDER BY ai_decisions.created_at DESC LIMIT 100',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get AI decision history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Workflow Recommendations Endpoints
// ============================================

// Get workflow recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    // TODO: Implement recommendation engine
    res.json({
      success: true,
      data: [],
      message: 'Recommendation engine - To be implemented'
    });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit recommendation feedback
router.post('/recommendations/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { viewed, applied, dismissed } = req.body;
    await query(
      'UPDATE workflow_recommendations SET viewed = COALESCE($1, viewed), applied = COALESCE($2, applied), dismissed = COALESCE($3, dismissed) WHERE id = $4',
      [viewed, applied, dismissed, req.params.id]
    );
    res.json({ success: true, message: 'Feedback recorded' });
  } catch (error: any) {
    console.error('Submit recommendation feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending workflows
router.get('/recommendations/trends', async (req: Request, res: Response) => {
  try {
    const userId = 'mock-user-id'; // TODO: Get from auth token
    // TODO: Implement trend analysis
    res.json({
      success: true,
      data: [],
      message: 'Trend analysis - To be implemented'
    });
  } catch (error: any) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
