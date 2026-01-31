import { query } from '../config/database';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: 'free' | 'starter' | 'business' | 'pro' | 'enterprise';
  settings: {
    max_accounts: number;
    max_users: number;
    max_workflows: number;
    features: string[];
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: Date;
}

/**
 * Create new tenant
 */
export const createTenant = async (
  name: string,
  slug: string,
  plan: Tenant['plan'] = 'free'
): Promise<Tenant> => {
  const planSettings = {
    free: { max_accounts: 1, max_users: 1, max_workflows: 3, features: ['basic'] },
    starter: { max_accounts: 3, max_users: 3, max_workflows: 10, features: ['basic', 'ai'] },
    business: { max_accounts: 10, max_users: 10, max_workflows: 50, features: ['basic', 'ai', 'analytics'] },
    pro: { max_accounts: 30, max_users: 30, max_workflows: 200, features: ['basic', 'ai', 'analytics', 'api'] },
    enterprise: { max_accounts: 999, max_users: 999, max_workflows: 999, features: ['all'] },
  };

  const result = await query(
    `INSERT INTO tenants (name, slug, plan, settings, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING *`,
    [name, slug, plan, JSON.stringify(planSettings[plan])]
  );

  return result.rows[0];
};

/**
 * Get tenant by ID
 */
export const getTenantById = async (tenantId: string): Promise<Tenant | null> => {
  const result = await query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  
  if (result.rows.length === 0) return null;
  
  return {
    ...result.rows[0],
    settings: typeof result.rows[0].settings === 'string' 
      ? JSON.parse(result.rows[0].settings) 
      : result.rows[0].settings
  };
};

/**
 * Get tenant by slug
 */
export const getTenantBySlug = async (slug: string): Promise<Tenant | null> => {
  const result = await query('SELECT * FROM tenants WHERE slug = $1', [slug]);
  
  if (result.rows.length === 0) return null;
  
  return {
    ...result.rows[0],
    settings: typeof result.rows[0].settings === 'string' 
      ? JSON.parse(result.rows[0].settings) 
      : result.rows[0].settings
  };
};

/**
 * Add user to tenant
 */
export const addUserToTenant = async (
  tenantId: string,
  userId: string,
  role: TenantUser['role'] = 'member'
): Promise<TenantUser> => {
  const result = await query(
    `INSERT INTO tenant_users (tenant_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = $3
     RETURNING *`,
    [tenantId, userId, role]
  );

  return result.rows[0];
};

/**
 * Remove user from tenant
 */
export const removeUserFromTenant = async (
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'DELETE FROM tenant_users WHERE tenant_id = $1 AND user_id = $2 RETURNING id',
    [tenantId, userId]
  );

  return result.rows.length > 0;
};

/**
 * Get user's tenants
 */
export const getUserTenants = async (userId: string): Promise<Tenant[]> => {
  const result = await query(
    `SELECT t.*, tu.role as user_role
     FROM tenants t
     JOIN tenant_users tu ON t.id = tu.tenant_id
     WHERE tu.user_id = $1 AND t.is_active = TRUE
     ORDER BY t.created_at DESC`,
    [userId]
  );

  return result.rows.map(row => ({
    ...row,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings
  }));
};

/**
 * Get tenant users
 */
export const getTenantUsers = async (tenantId: string): Promise<any[]> => {
  const result = await query(
    `SELECT tu.*, u.email, u.name
     FROM tenant_users tu
     JOIN users u ON tu.user_id = u.id
     WHERE tu.tenant_id = $1
     ORDER BY tu.created_at DESC`,
    [tenantId]
  );

  return result.rows;
};

/**
 * Check if user is member of tenant
 */
export const isTenantMember = async (
  tenantId: string,
  userId: string
): Promise<{ isMember: boolean; role?: string }> => {
  const result = await query(
    'SELECT role FROM tenant_users WHERE tenant_id = $1 AND user_id = $2',
    [tenantId, userId]
  );

  if (result.rows.length === 0) {
    return { isMember: false };
  }

  return { isMember: true, role: result.rows[0].role };
};

/**
 * Check tenant limits
 */
export const checkTenantLimits = async (
  tenantId: string,
  limitType: 'accounts' | 'users' | 'workflows'
): Promise<{ current: number; limit: number; withinLimit: boolean }> => {
  const tenant = await getTenantById(tenantId);
  
  if (!tenant) {
    return { current: 0, limit: 0, withinLimit: false };
  }

  let currentQuery = '';
  let limit = 0;

  switch (limitType) {
    case 'accounts':
      limit = tenant.settings.max_accounts;
      currentQuery = 'SELECT COUNT(*) as count FROM instagram_accounts WHERE tenant_id = $1';
      break;
    case 'users':
      limit = tenant.settings.max_users;
      currentQuery = 'SELECT COUNT(*) as count FROM tenant_users WHERE tenant_id = $1';
      break;
    case 'workflows':
      limit = tenant.settings.max_workflows;
      currentQuery = 'SELECT COUNT(*) as count FROM workflows WHERE tenant_id = $1 AND is_active = TRUE';
      break;
    default:
      return { current: 0, limit: 0, withinLimit: false };
  }

  const result = await query(currentQuery, [tenantId]);
  const current = parseInt(result.rows[0].count);

  return {
    current,
    limit,
    withinLimit: current < limit
  };
};

/**
 * Update tenant plan
 */
export const updateTenantPlan = async (
  tenantId: string,
  newPlan: Tenant['plan']
): Promise<Tenant | null> => {
  const planSettings = {
    free: { max_accounts: 1, max_users: 1, max_workflows: 3, features: ['basic'] },
    starter: { max_accounts: 3, max_users: 3, max_workflows: 10, features: ['basic', 'ai'] },
    business: { max_accounts: 10, max_users: 10, max_workflows: 50, features: ['basic', 'ai', 'analytics'] },
    pro: { max_accounts: 30, max_users: 30, max_workflows: 200, features: ['basic', 'ai', 'analytics', 'api'] },
    enterprise: { max_accounts: 999, max_users: 999, max_workflows: 999, features: ['all'] },
  };

  const result = await query(
    'UPDATE tenants SET plan = $1, settings = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [newPlan, JSON.stringify(planSettings[newPlan]), tenantId]
  );

  if (result.rows.length === 0) return null;

  return {
    ...result.rows[0],
    settings: planSettings[newPlan]
  };
};
