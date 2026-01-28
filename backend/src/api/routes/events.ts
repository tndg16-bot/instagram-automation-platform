import { Router, Request, Response } from 'express';
import { query } from '../../config/database';

const router = Router();

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  location: string;
  capacity: number;
  current_participants: number;
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  image_url: string | null;
  created_at: Date;
}

interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: Date;
}

// GET /api/events - Event list
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, mine } = req.query;
    const userId = (req as any).user?.id;

    let whereClause = 'WHERE e.status != $1';
    const params: any[] = ['cancelled'];

    if (status) {
      whereClause += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }

    if (mine === 'true' && userId) {
      whereClause += ` AND e.id IN (SELECT event_id FROM event_participants WHERE user_id = $${params.length + 1})`;
      params.push(userId);
    }

    const result = await query(
      `SELECT e.*, 
              (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participant_count
       FROM events e
       ${whereClause}
       ORDER BY e.start_date ASC`,
      params
    );

    res.json({
      success: true,
      data: result.rows.map((event: any) => ({
        ...event,
        participant_count: parseInt(event.participant_count || '0'),
      })),
    });
  } catch (error: any) {
    console.error('Error getting events:', error);
    res.status(500).json({ success: false, error: 'Failed to get events' });
  }
});

// POST /api/events/:id/register - Event registration
router.post('/:id/register', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if event exists and is not full
    const eventResult = await query(
      `SELECT e.*, (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participant_count
       FROM events e
       WHERE e.id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const event = eventResult.rows[0];
    const participantCount = parseInt(event.participant_count || '0');

    // Check capacity
    if (participantCount >= event.capacity) {
      return res.status(400).json({ success: false, error: 'Event is full' });
    }

    // Check if already registered
    const existingResult = await query(
      'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Already registered' });
    }

    // Register for event
    const result = await query(
      `INSERT INTO event_participants (event_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error registering for event:', error);
    res.status(500).json({ success: false, error: 'Failed to register for event' });
  }
});

// GET /api/events/:id/participants - Participant list
router.get('/:id/participants', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if user is authorized to see participants
    const eventResult = await query(
      'SELECT created_by FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // For now, allow all logged-in users to see participants
    // In production, you might want to restrict this to event creators or participants

    const result = await query(
      `SELECT ep.*, u.username, u.avatar_url, u.email
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = $1
       ORDER BY ep.registered_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error getting event participants:', error);
    res.status(500).json({ success: false, error: 'Failed to get participants' });
  }
});

// GET /api/events/:id - Get event details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const result = await query(
      `SELECT e.*, (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participant_count,
              CASE WHEN ep.user_id = $2 THEN true ELSE false END as is_registered
       FROM events e
       LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = $2
       WHERE e.id = $1`,
      [id, userId || '']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        participant_count: parseInt(result.rows[0].participant_count || '0'),
        is_registered: !!result.rows[0].is_registered,
      },
    });
  } catch (error: any) {
    console.error('Error getting event:', error);
    res.status(500).json({ success: false, error: 'Failed to get event' });
  }
});

export default router;
