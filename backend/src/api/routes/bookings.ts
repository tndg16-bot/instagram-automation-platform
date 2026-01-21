import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Booking, AvailableSlot } from '../../types/commerce';

const router = Router();

// Mock bookings storage
const bookings: Record<string, Booking> = {};

/**
 * POST / - Create a new booking
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { userId, serviceId, scheduledAt } = req.body;

    // Validate input
    if (!userId || !serviceId || !scheduledAt) {
      return res.status(400).json({
        error: 'Missing required fields: userId, serviceId, scheduledAt',
      });
    }

    // Validate scheduledAt is a valid future date
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid scheduledAt date format',
      });
    }

    if (scheduledDate < new Date()) {
      return res.status(400).json({
        error: 'scheduledAt must be in the future',
      });
    }

    // Create booking
    const bookingId = uuidv4();
    const booking: Booking = {
      id: bookingId,
      userId,
      serviceId,
      scheduledAt: scheduledDate,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store booking
    bookings[bookingId] = booking;

    res.status(201).json({
      success: true,
      booking: {
        id: booking.id,
        userId: booking.userId,
        serviceId: booking.serviceId,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /availability - Check availability (Mock)
 * Returns available time slots for a service
 */
router.get('/availability', (req: Request, res: Response) => {
  try {
    const { serviceId, date } = req.query;

    // If date is provided, parse it
    const targetDate = date ? new Date(date as string) : new Date();

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
      });
    }

    // Mock availability slots (9:00 AM to 6:00 PM, 1-hour intervals)
    const availableSlots: AvailableSlot[] = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      // Randomly mark some slots as unavailable
      const isAvailable = Math.random() > 0.3; // 70% availability

      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, 0, 0, 0);

      availableSlots.push({
        id: `slot_${hour}`,
        startTime: new Date(slotTime),
        endTime: new Date(slotTime.getTime() + 60 * 60 * 1000), // +1 hour
        isAvailable,
      });
    }

    res.json({
      success: true,
      serviceId: serviceId || 'all',
      date: targetDate.toISOString().split('T')[0],
      availableSlots,
      totalSlots: availableSlots.length,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /:id - Get booking details
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const booking = bookings[id];

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        userId: booking.userId,
        serviceId: booking.serviceId,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET / - List bookings (optionally filtered by userId)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let filteredBookings = Object.values(bookings);

    if (userId) {
      filteredBookings = filteredBookings.filter(
        (booking: Booking) => booking.userId === userId
      );
    }

    // Sort by scheduledAt ascending (upcoming first)
    filteredBookings.sort((a: Booking, b: Booking) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    res.json({
      success: true,
      bookings: filteredBookings,
      count: filteredBookings.length,
    });
  } catch (error) {
    console.error('Error listing bookings:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /:id - Update booking status
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const booking = bookings[id];

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();

    res.json({
      success: true,
      booking: {
        id: booking.id,
        userId: booking.userId,
        serviceId: booking.serviceId,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /:id - Cancel/delete booking
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const booking = bookings[id];

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    // Soft delete by marking as cancelled
    booking.status = 'cancelled';
    booking.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /:id/cancel - Cancel booking
 */
router.put('/:id/cancel', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const booking = bookings[id];

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    booking.status = 'cancelled';
    booking.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking.id,
        userId: booking.userId,
        serviceId: booking.serviceId,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
