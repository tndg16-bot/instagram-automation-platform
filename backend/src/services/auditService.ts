import { query } from '../config/database';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  tenant_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'password_change'
  | 'api_key_generated'
  | 'webhook_created'
  | 'webhook_deleted'
  | 'workflow_created'
  | 'workflow_updated'
  | 'workflow_deleted'
  | 'workflow_executed'
  | 'settings_updated'
  | 'export'
  | 'import';

/**
 * Log an audit event
 */
export const logAuditEvent = async (entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> => {
  try {
    await query(
      `INSERT INTO audit_logs 
       (user_id, tenant_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.user_id,
        entry.tenant_id,
        entry.action,
        entry.resource_type,
        entry.resource_id,
        entry.old_value ? JSON.stringify(entry.old_value) : null,
        entry.new_value ? JSON.stringify(entry.new_value) : null,
        entry.ip_address,
        entry.user_agent,
      ]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break functionality
  }
};

/**
 * Get audit logs with filtering
 */
export const getAuditLogs = async (options: {
  user_id?: string;
  tenant_id?: string;
  action?: AuditAction;
  resource_type?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> => {
  const {
    user_id,
    tenant_id,
    action,
    resource_type,
    start_date,
    end_date,
    limit = 50,
    offset = 0,
  } = options;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (user_id) {
    params.push(user_id);
    whereClause += ` AND user_id = $${params.length}`;
  }

  if (tenant_id) {
    params.push(tenant_id);
    whereClause += ` AND tenant_id = $${params.length}`;
  }

  if (action) {
    params.push(action);
    whereClause += ` AND action = $${params.length}`;
  }

  if (resource_type) {
    params.push(resource_type);
    whereClause += ` AND resource_type = $${params.length}`;
  }

  if (start_date) {
    params.push(start_date);
    whereClause += ` AND created_at >= $${params.length}`;
  }

  if (end_date) {
    params.push(end_date);
    whereClause += ` AND created_at <= $${params.length}`;
  }

  const logsQuery = `
    SELECT * FROM audit_logs 
    ${whereClause} 
    ORDER BY created_at DESC 
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;

  const [logsResult, countResult] = await Promise.all([
    query(logsQuery, [...params, limit, offset]),
    query(countQuery, params),
  ]);

  return {
    logs: logsResult.rows.map((row: any) => ({
      ...row,
      old_value: row.old_value ? JSON.parse(row.old_value) : null,
      new_value: row.new_value ? JSON.parse(row.new_value) : null,
    })),
    total: parseInt(countResult.rows[0].total),
  };
};

/**
 * Get audit log statistics
 */
export const getAuditStats = async (tenant_id?: string): Promise<{
  total_events: number;
  events_by_action: Record<string, number>;
  events_by_day: { date: string; count: number }[];
}> => {
  let whereClause = '';
  const params: any[] = [];

  if (tenant_id) {
    whereClause = 'WHERE tenant_id = $1';
    params.push(tenant_id);
  }

  const [totalResult, actionResult, dailyResult] = await Promise.all([
    query(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`, params),
    query(
      `SELECT action, COUNT(*) as count FROM audit_logs ${whereClause} GROUP BY action`,
      params
    ),
    query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM audit_logs ${whereClause} 
       AND created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      params
    ),
  ]);

  const eventsByAction: Record<string, number> = {};
  actionResult.rows.forEach((row: any) => {
    eventsByAction[row.action] = parseInt(row.count);
  });

  return {
    total_events: parseInt(totalResult.rows[0].count),
    events_by_action: eventsByAction,
    events_by_day: dailyResult.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count),
    })),
  };
};

/**
 * Create audit log middleware for Express
 */
export const auditMiddleware = (action: AuditAction, resource_type: string) => {
  return async (req: any, res: any, next: any) => {
    const oldJson = res.json;
    
    res.json = function(data: any) {
      // Restore original json method
      res.json = oldJson;
      
      // Log after response is sent
      if (req.user?.id) {
        logAuditEvent({
          user_id: req.user.id,
          tenant_id: req.user.tenant_id,
          action,
          resource_type,
          resource_id: data?.data?.id || req.params.id || 'unknown',
          new_value: data?.data,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
        }).catch(console.error);
      }
      
      return res.json(data);
    };
    
    next();
  };
};
