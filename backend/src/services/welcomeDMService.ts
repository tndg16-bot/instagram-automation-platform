import { query } from '../config/database';
import InstagramGraphClient from './instagramClient';

export interface WelcomeTemplate {
  id: string;
  user_id: string;
  instagram_account_id: string;
  template_name: string;
  message_content: string;
  delay_minutes: number;
  is_active: boolean;
  personalization_vars: string[];
  sent_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWelcomeTemplateDto {
  template_name: string;
  message_content: string;
  delay_minutes?: number;
  personalization_vars?: string[];
}

export interface WelcomeDMLog {
  id: string;
  template_id: string;
  instagram_account_id: string;
  recipient_id: string;
  recipient_username: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_at: Date;
  sent_at?: Date;
  error_message?: string;
  created_at: Date;
}

// Rate limiting config
const WELCOME_DM_RATE_LIMITS = {
  maxPerHour: 30,
  maxPerDay: 100,
  minDelayBetweenSends: 2 * 60 * 1000, // 2 minutes
};

/**
 * Get welcome templates for a user
 */
export const getWelcomeTemplates = async (
  userId: string,
  instagramAccountId?: string
): Promise<WelcomeTemplate[]> => {
  let sql = 'SELECT * FROM welcome_dm_templates WHERE user_id = $1';
  const params: any[] = [userId];
  
  if (instagramAccountId) {
    sql += ' AND instagram_account_id = $2';
    params.push(instagramAccountId);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = await query(sql, params);
  return result.rows.map(row => ({
    ...row,
    personalization_vars: Array.isArray(row.personalization_vars) 
      ? row.personalization_vars 
      : JSON.parse(row.personalization_vars || '[]')
  }));
};

/**
 * Get active welcome template for an Instagram account
 */
export const getActiveWelcomeTemplate = async (
  instagramAccountId: string
): Promise<WelcomeTemplate | null> => {
  const result = await query(
    'SELECT * FROM welcome_dm_templates WHERE instagram_account_id = $1 AND is_active = TRUE LIMIT 1',
    [instagramAccountId]
  );
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    ...row,
    personalization_vars: Array.isArray(row.personalization_vars) 
      ? row.personalization_vars 
      : JSON.parse(row.personalization_vars || '[]')
  };
};

/**
 * Create welcome template
 */
export const createWelcomeTemplate = async (
  userId: string,
  instagramAccountId: string,
  dto: CreateWelcomeTemplateDto
): Promise<WelcomeTemplate> => {
  // Deactivate existing templates for this account
  await query(
    'UPDATE welcome_dm_templates SET is_active = FALSE WHERE instagram_account_id = $1',
    [instagramAccountId]
  );
  
  const result = await query(
    `INSERT INTO welcome_dm_templates 
     (user_id, instagram_account_id, template_name, message_content, delay_minutes, personalization_vars, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING *`,
    [
      userId,
      instagramAccountId,
      dto.template_name,
      dto.message_content,
      dto.delay_minutes || 0,
      JSON.stringify(dto.personalization_vars || ['username']),
    ]
  );
  
  return result.rows[0];
};

/**
 * Update welcome template
 */
export const updateWelcomeTemplate = async (
  templateId: string,
  userId: string,
  dto: Partial<CreateWelcomeTemplateDto>
): Promise<WelcomeTemplate | null> => {
  // Verify ownership
  const checkResult = await query(
    'SELECT * FROM welcome_dm_templates WHERE id = $1 AND user_id = $2',
    [templateId, userId]
  );
  
  if (checkResult.rows.length === 0) return null;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (dto.template_name !== undefined) {
    params.push(dto.template_name);
    updates.push(`template_name = $${params.length}`);
  }
  
  if (dto.message_content !== undefined) {
    params.push(dto.message_content);
    updates.push(`message_content = $${params.length}`);
  }
  
  if (dto.delay_minutes !== undefined) {
    params.push(dto.delay_minutes);
    updates.push(`delay_minutes = $${params.length}`);
  }
  
  if (dto.personalization_vars !== undefined) {
    params.push(JSON.stringify(dto.personalization_vars));
    updates.push(`personalization_vars = $${params.length}`);
  }
  
  if (updates.length === 0) return checkResult.rows[0];
  
  params.push(templateId);
  const result = await query(
    `UPDATE welcome_dm_templates SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  
  return result.rows[0];
};

/**
 * Activate/deactivate welcome template
 */
export const setTemplateActive = async (
  templateId: string,
  userId: string,
  isActive: boolean
): Promise<boolean> => {
  const result = await query(
    'UPDATE welcome_dm_templates SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
    [isActive, templateId, userId]
  );
  
  return result.rows.length > 0;
};

/**
 * Delete welcome template
 */
export const deleteWelcomeTemplate = async (
  templateId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'DELETE FROM welcome_dm_templates WHERE id = $1 AND user_id = $2 RETURNING id',
    [templateId, userId]
  );
  
  return result.rows.length > 0;
};

/**
 * Fill template with variables
 */
export const fillTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  let filled = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    filled = filled.replace(regex, value);
  }
  
  return filled;
};

/**
 * Check rate limits for welcome DMs
 */
export const checkRateLimits = async (
  instagramAccountId: string
): Promise<{ allowed: boolean; reason?: string }> => {
  // Check hourly limit
  const hourlyResult = await query(
    `SELECT COUNT(*) as count FROM welcome_dm_logs 
     WHERE instagram_account_id = $1 
     AND created_at >= NOW() - INTERVAL '1 hour'`,
    [instagramAccountId]
  );
  
  const hourlyCount = parseInt(hourlyResult.rows[0].count);
  if (hourlyCount >= WELCOME_DM_RATE_LIMITS.maxPerHour) {
    return { allowed: false, reason: 'Hourly rate limit exceeded' };
  }
  
  // Check daily limit
  const dailyResult = await query(
    `SELECT COUNT(*) as count FROM welcome_dm_logs 
     WHERE instagram_account_id = $1 
     AND created_at >= NOW() - INTERVAL '1 day'`,
    [instagramAccountId]
  );
  
  const dailyCount = parseInt(dailyResult.rows[0].count);
  if (dailyCount >= WELCOME_DM_RATE_LIMITS.maxPerDay) {
    return { allowed: false, reason: 'Daily rate limit exceeded' };
  }
  
  // Check last send time
  const lastSendResult = await query(
    `SELECT sent_at FROM welcome_dm_logs 
     WHERE instagram_account_id = $1 AND status = 'sent'
     ORDER BY sent_at DESC LIMIT 1`,
    [instagramAccountId]
  );
  
  if (lastSendResult.rows.length > 0) {
    const lastSent = new Date(lastSendResult.rows[0].sent_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastSent.getTime();
    
    if (timeDiff < WELCOME_DM_RATE_LIMITS.minDelayBetweenSends) {
      return { allowed: false, reason: 'Minimum delay between sends not met' };
    }
  }
  
  return { allowed: true };
};

/**
 * Schedule welcome DM for new follower
 */
export const scheduleWelcomeDM = async (
  templateId: string,
  instagramAccountId: string,
  recipientId: string,
  recipientUsername: string,
  variables: Record<string, string>
): Promise<WelcomeDMLog | null> => {
  // Get template
  const templateResult = await query(
    'SELECT * FROM welcome_dm_templates WHERE id = $1',
    [templateId]
  );
  
  if (templateResult.rows.length === 0) return null;
  
  const template = templateResult.rows[0];
  const filledMessage = fillTemplate(template.message_content, variables);
  
  // Calculate scheduled time
  const scheduledAt = new Date();
  scheduledAt.setMinutes(scheduledAt.getMinutes() + template.delay_minutes);
  
  // Create log entry
  const result = await query(
    `INSERT INTO welcome_dm_logs 
     (template_id, instagram_account_id, recipient_id, recipient_username, message_content, status, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6)
     RETURNING *`,
    [templateId, instagramAccountId, recipientId, recipientUsername, filledMessage, scheduledAt]
  );
  
  return result.rows[0];
};

/**
 * Send scheduled welcome DM
 */
export const sendWelcomeDM = async (
  logId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get log entry
    const logResult = await query(
      'SELECT * FROM welcome_dm_logs WHERE id = $1',
      [logId]
    );
    
    if (logResult.rows.length === 0) {
      return { success: false, error: 'Log entry not found' };
    }
    
    const log = logResult.rows[0];
    
    // Check rate limits
    const rateCheck = await checkRateLimits(log.instagram_account_id);
    if (!rateCheck.allowed) {
      await query(
        "UPDATE welcome_dm_logs SET status = 'failed', error_message = $1 WHERE id = $2",
        [rateCheck.reason, logId]
      );
      return { success: false, error: rateCheck.reason };
    }
    
    // Send DM via Instagram API
    const instagramClient = new InstagramGraphClient(accessToken);
    await instagramClient.sendDM(log.recipient_id, log.message_content);
    
    // Update log
    await query(
      "UPDATE welcome_dm_logs SET status = 'sent', sent_at = NOW() WHERE id = $1",
      [logId]
    );
    
    // Increment template sent count
    await query(
      'UPDATE welcome_dm_templates SET sent_count = sent_count + 1 WHERE id = $1',
      [log.template_id]
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Error sending welcome DM:', error);
    
    await query(
      "UPDATE welcome_dm_logs SET status = 'failed', error_message = $1 WHERE id = $2",
      [error.message, logId]
    );
    
    return { success: false, error: error.message };
  }
};

/**
 * Process pending welcome DMs (to be called by scheduler)
 */
export const processPendingWelcomeDMs = async (
  accessToken: string,
  batchSize: number = 10
): Promise<{ processed: number; succeeded: number; failed: number }> => {
  // Get pending DMs that are due
  const pendingResult = await query(
    `SELECT * FROM welcome_dm_logs 
     WHERE status = 'pending' AND scheduled_at <= NOW()
     ORDER BY scheduled_at ASC
     LIMIT $1`,
    [batchSize]
  );
  
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  
  for (const log of pendingResult.rows) {
    processed++;
    const result = await sendWelcomeDM(log.id, accessToken);
    
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }
  
  return { processed, succeeded, failed };
};

/**
 * Get welcome DM statistics
 */
export const getWelcomeDMStats = async (
  userId: string,
  instagramAccountId?: string
): Promise<{
  totalSent: number;
  totalFailed: number;
  pendingCount: number;
  templatesCount: number;
}> => {
  let sql = `
    SELECT 
      COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count
    FROM welcome_dm_logs wdl
    JOIN welcome_dm_templates wdt ON wdl.template_id = wdt.id
    WHERE wdt.user_id = $1
  `;
  const params: any[] = [userId];
  
  if (instagramAccountId) {
    sql += ' AND wdl.instagram_account_id = $2';
    params.push(instagramAccountId);
  }
  
  const result = await query(sql, params);
  
  const templatesResult = await query(
    'SELECT COUNT(*) as count FROM welcome_dm_templates WHERE user_id = $1',
    [userId]
  );
  
  return {
    totalSent: parseInt(result.rows[0].sent_count),
    totalFailed: parseInt(result.rows[0].failed_count),
    pendingCount: parseInt(result.rows[0].pending_count),
    templatesCount: parseInt(templatesResult.rows[0].count),
  };
};
