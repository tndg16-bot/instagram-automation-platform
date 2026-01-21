import { OrderItem, PaymentRequest, PaymentResult } from '../types/commerce';

// Re-export types for backward compatibility
export type { OrderItem, PaymentRequest, PaymentResult };

const MOCK_MODE = process.env.MOCK_MODE === 'true';

class PaymentService {
  /**
   * Process payment for an order
   * In mock mode, always returns success
   * In production mode, uses Stripe API
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    if (MOCK_MODE) {
      return this.mockProcessPayment(request);
    }

    return this.stripeProcessPayment(request);
  }

  /**
   * Mock payment processing for development
   */
  private async mockProcessPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      paymentId: `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
    };
  }

  /**
   * Stripe payment processing for production
   */
  private async stripeProcessPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // TODO: Implement actual Stripe integration
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: request.amount,
      //   currency: request.currency || 'jpy',
      //   payment_method: request.paymentMethodId,
      //   confirm: true,
      // });

      return {
        success: true,
        paymentId: 'stripe_placeholder',
        status: 'succeeded',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResult> {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        paymentId,
        status: 'refunded',
      };
    }

    try {
      // TODO: Implement actual Stripe refund
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const refund = await stripe.refunds.create({
      //   payment_intent: paymentId,
      //   amount,
      // });

      return {
        success: true,
        paymentId,
        status: 'refunded',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    if (MOCK_MODE) {
      return {
        success: true,
        paymentId,
        status: 'succeeded',
      };
    }

    try {
      // TODO: Implement actual Stripe status check
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

      return {
        success: true,
        paymentId,
        status: 'succeeded',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve payment status',
      };
    }
  }
}

export const paymentService = new PaymentService();
