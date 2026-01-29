import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

// GET /api/email/providers - List email providers
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT * FROM email_providers WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error listing email providers:', error);
    res.status(500).json({ success: false, error: 'Failed to list email providers' });
  }
});

// POST /api/email/providers - Create new email provider
router.post('/providers', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { name, type, api_key, api_endpoint, from_email, from_name, config, is_default } = req.body;

    if (!name || !type || !api_key) {
      return res.status(400).json({ success: false, error: 'Name, type, and API key are required' });
    }

    let shouldMakeDefault = is_default;
    if (shouldMakeDefault === undefined) {
      const existingResult = await query(
        'SELECT COUNT(*) as count FROM email_providers WHERE user_id = $1 AND is_default = true',
        [userId]
      );
      shouldMakeDefault = parseInt(existingResult.rows[0].count) === 0;
    }

    const result = await query(
      `INSERT INTO email_providers (user_id, name, type, api_key, api_endpoint, from_email, from_name, config, is_default, total_sent, total_delivered, total_failed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, name, type, api_key, api_endpoint || null, from_email || null, from_name || null, JSON.stringify(config || {}), shouldMakeDefault]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating email provider:', error);
    res.status(500).json({ success: false, error: 'Failed to create email provider' });
  }
});

// GET /api/email/providers/:id - Get email provider details
router.get('/providers/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM email_providers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email provider not found' });
    }

    const provider = result.rows[0];
    
    res.json({
      success: true,
      data: {
        ...provider,
        api_key: provider.api_key ? '***HIDDEN***' : null,
      },
    });
  } catch (error: any) {
    console.error('Error getting email provider:', error);
    res.status(500).json({ success: false, error: 'Failed to get email provider' });
  }
});

// PUT /api/email/providers/:id - Update email provider
router.put('/providers/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { name, api_key, api_endpoint, from_email, from_name, config, is_default } = req.body;

    const result = await query(
      'SELECT * FROM email_providers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email provider not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 3;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (api_key !== undefined) {
      updates.push(`api_key = $${paramIndex++}`);
      values.push(api_key);
    }
    if (api_endpoint !== undefined) {
      updates.push(`api_endpoint = $${paramIndex++}`);
      values.push(api_endpoint);
    }
    if (from_email !== undefined) {
      updates.push(`from_email = $${paramIndex++}`);
      values.push(from_email);
    }
    if (from_name !== undefined) {
      updates.push(`from_name = $${paramIndex++}`);
      values.push(from_name);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(config));
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(is_default);
    }

    values.push(id);
    const queryStr = `UPDATE email_providers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;

    const updateResult = await query(queryStr, values);

    res.json({
      success: true,
      data: updateResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating email provider:', error);
    res.status(500).json({ success: false, error: 'Failed to update email provider' });
  }
});

// DELETE /api/email/providers/:id - Delete email provider
router.delete('/providers/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM email_providers WHERE id = $1 AND user_id = $2 AND is_default = true',
      [id, userId]
    );

    if (result.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete default email provider' });
    }

    await query('DELETE FROM email_logs WHERE provider_id = $1', [id]);
    await query('DELETE FROM email_providers WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Email provider deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting email provider:', error);
    res.status(500).json({ success: false, error: 'Failed to delete email provider' });
  }
});

// GET /api/email/logs - Get email logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { limit = 50, status, provider_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (provider_id) {
      whereClause += ` AND provider_id = $${params.length + 1}`;
      params.push(provider_id);
    }

    const result = await query(
      `SELECT * FROM email_logs ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM email_logs ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: Number(limit),
        total: parseInt(countResult.rows[0].total),
        page: 1,
        has_more: result.rows.length === Number(limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting email logs:', error);
    res.status(500).json({ success: false, error: 'Failed to get email logs' });
  }
});

export default router;
