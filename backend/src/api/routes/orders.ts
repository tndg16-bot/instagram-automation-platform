import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { paymentService } from '../../services/paymentService';
import { Order, OrderItem, PaymentRequest } from '../../types/commerce';

const router = Router();

// Mock orders storage
const orders: Record<string, Order> = {};

/**
 * POST / - Create a new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, amount, currency = 'jpy', items, paymentMethodId } = req.body;

    // Validate input
    if (!userId || !amount || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: userId, amount, items',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0',
      });
    }

    // Create order
    const orderId = uuidv4();
    const order: Order = {
      id: orderId,
      userId,
      amount,
      currency,
      status: 'pending',
      items,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store order
    orders[orderId] = order;

    // Process payment
    const paymentRequest: PaymentRequest = {
      userId,
      amount,
      currency,
      items,
      paymentMethodId,
    };

    const paymentResult = await paymentService.processPayment(paymentRequest);

    if (paymentResult.success) {
      order.status = 'paid';
      order.paymentId = paymentResult.paymentId;
      order.updatedAt = new Date();
    } else {
      order.status = 'failed';
      order.updatedAt = new Date();
    }

    res.status(201).json({
      success: paymentResult.success,
      order: {
        id: order.id,
        userId: order.userId,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        items: order.items,
        paymentId: order.paymentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      payment: paymentResult.success ? {
        paymentId: paymentResult.paymentId,
        status: paymentResult.status,
      } : undefined,
      error: paymentResult.success ? undefined : paymentResult.error,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET /:id - Get order details
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const order = orders[id];

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        userId: order.userId,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        items: order.items,
        paymentId: order.paymentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * GET / - List orders (optionally filtered by userId)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let filteredOrders = Object.values(orders);

    if (userId) {
      filteredOrders = filteredOrders.filter(
        (order: any) => order.userId === userId
      );
    }

    // Sort by createdAt descending
    filteredOrders.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      orders: filteredOrders,
      count: filteredOrders.length,
    });
  } catch (error) {
    console.error('Error listing orders:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
