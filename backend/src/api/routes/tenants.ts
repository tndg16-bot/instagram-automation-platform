import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import * as tenantService from '../../services/tenantService';

const router = Router();

/**
 * GET /api/tenants
 * List user's tenants
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const tenants = await tenantService.getUserTenants(userId);
    res.json({ success: true, data: tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
});

/**
 * POST /api/tenants
 * Create new tenant
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, slug, plan = 'free' } = req.body;

    if (!userId || !name || !slug) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const tenant = await tenantService.createTenant(name, slug, plan);
    
    // Add creator as owner
    await tenantService.addUserToTenant(tenant.id, userId, 'owner');

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ success: false, error: 'Failed to create tenant' });
  }
});

/**
 * GET /api/tenants/:id
 * Get tenant details
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // Check membership
    const membership = await tenantService.isTenantMember(id, userId);
    if (!membership.isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tenant = await tenantService.getTenantById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.json({ success: true, data: { ...tenant, user_role: membership.role } });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenant' });
  }
});

/**
 * GET /api/tenants/:id/users
 * List tenant users
 */
router.get('/:id/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // Check membership
    const membership = await tenantService.isTenantMember(id, userId);
    if (!membership.isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const users = await tenantService.getTenantUsers(id);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/tenants/:id/users
 * Add user to tenant
 */
router.post('/:id/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    if (!userId || !id || !user_id) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // Check if requester is admin/owner
    const membership = await tenantService.isTenantMember(id, userId);
    if (!membership.isMember || !['owner', 'admin'].includes(membership.role || '')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tenantUser = await tenantService.addUserToTenant(id, user_id, role);
    res.status(201).json({ success: true, data: tenantUser });
  } catch (error) {
    console.error('Error adding user to tenant:', error);
    res.status(500).json({ success: false, error: 'Failed to add user' });
  }
});

/**
 * DELETE /api/tenants/:id/users/:userId
 * Remove user from tenant
 */
router.delete('/:id/users/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, userId: targetUserId } = req.params;

    if (!userId || !id || !targetUserId) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    // Check if requester is admin/owner
    const membership = await tenantService.isTenantMember(id, userId);
    if (!membership.isMember || !['owner', 'admin'].includes(membership.role || '')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const removed = await tenantService.removeUserFromTenant(id, targetUserId);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User removed' });
  } catch (error) {
    console.error('Error removing user from tenant:', error);
    res.status(500).json({ success: false, error: 'Failed to remove user' });
  }
});

/**
 * GET /api/tenants/:id/limits
 * Check tenant limits
 */
router.get('/:id/limits', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { type } = req.query;

    if (!userId || !id || !type) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const membership = await tenantService.isTenantMember(id, userId);
    if (!membership.isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const limits = await tenantService.checkTenantLimits(
      id,
      type as 'accounts' | 'users' | 'workflows'
    );

    res.json({ success: true, data: limits });
  } catch (error) {
    console.error('Error checking tenant limits:', error);
    res.status(500).json({ success: false, error: 'Failed to check limits' });
  }
});

export default router;
