import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../utils/auth';
import { query } from '../../config/database';

const router = Router();

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_at: Date;
  end_at?: Date;
  timezone: string;
  location_type: string;
  location_address?: string;
  meeting_url?: string;
  capacity?: number;
  image_url?: string;
  status: string;
  is_published: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  registered_at: Date;
  attended_at?: Date;
  notes?: string;
}

/**
 * GET /api/events
 * Get all published events
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = 'WHERE is_published = TRUE';
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      whereClause += ` AND event_type = $${params.length}`;
    }
    
    const eventsQuery = `
      SELECT * FROM events 
      ${whereClause} 
      ORDER BY start_at ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const countQuery = `SELECT COUNT(*) as total FROM events ${whereClause}`;
    
    const [eventsResult, countResult] = await Promise.all([
      query(eventsQuery, [...params, parseInt(limit as string), offset]),
      query(countQuery, params)
    ]);
    
    res.json({
      success: true,
      data: {
        events: eventsResult.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/my-events
 * Get user's registered events
 */
router.get('/my-events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT e.*, er.status as registration_status, er.registered_at 
       FROM events e 
       JOIN event_registrations er ON e.id = er.event_id 
       WHERE er.user_id = $1 
       ORDER BY e.start_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching my events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch my events' });
  }
});

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const eventResult = await query(
      'SELECT * FROM events WHERE id = $1 AND is_published = TRUE',
      [id]
    );
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    // Get registration count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1 AND status = $2',
      [id, 'registered']
    );
    
    res.json({
      success: true,
      data: {
        ...eventResult.rows[0],
        registered_count: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
});

/**
 * POST /api/events/:id/register
 * Register for an event
 */
router.post('/:id/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { notes } = req.body;
    
    // Check if event exists and has capacity
    const eventResult = await query(
      'SELECT capacity FROM events WHERE id = $1 AND is_published = TRUE AND status = $2',
      [id, 'upcoming']
    );
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found or not open for registration' });
    }
    
    const capacity = eventResult.rows[0].capacity;
    
    // Check capacity
    if (capacity) {
      const countResult = await query(
        'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = $1 AND status = $2',
        [id, 'registered']
      );
      
      if (parseInt(countResult.rows[0].count) >= capacity) {
        return res.status(400).json({ success: false, error: 'Event is full' });
      }
    }
    
    // Register user
    const result = await query(
      `INSERT INTO event_registrations (event_id, user_id, status, notes) 
       VALUES ($1, $2, 'registered', $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET
       status = 'registered', notes = $3, registered_at = NOW()
       RETURNING *`,
      [id, userId, notes]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ success: false, error: 'Failed to register for event' });
  }
});

/**
 * DELETE /api/events/:id/register
 * Cancel registration
 */
router.delete('/:id/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    
    await query(
      "UPDATE event_registrations SET status = 'cancelled' WHERE event_id = $1 AND user_id = $2",
      [id, userId]
    );
    
    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel registration' });
  }
});

/**
 * GET /api/events/:id/participants
 * Get event participants (admin only)
 */
router.get('/:id/participants', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT er.*, u.name as user_name, u.email as user_email
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.registered_at DESC`,
      [id]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

export default router;
