import express, { Router, Request, Response } from 'express';
import workflowService from '../../services/workflowService';

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

export default router;
