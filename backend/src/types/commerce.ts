// Order and Booking Type Definitions
// Centralized type definitions for commerce and booking functionality

/**
 * Order item details
 */
export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

/**
 * Order status types
 */
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Order entity
 */
export interface Order {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  items: OrderItem[];
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment request payload
 */
export interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  items: OrderItem[];
  paymentMethodId?: string;
}

/**
 * Payment result
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
}

/**
 * Booking status types
 */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Booking entity
 */
export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  scheduledAt: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking request payload
 */
export interface BookingRequest {
  userId: string;
  serviceId: string;
  scheduledAt: Date;
}

/**
 * Available time slot
 */
export interface AvailableSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

/**
 * Availability check result
 */
export interface AvailabilityResult {
  serviceId?: string;
  date: string;
  availableSlots: AvailableSlot[];
  totalSlots: number;
}

/**
 * Service type for booking
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service category
 */
export type ServiceCategory = 'consulting' | 'coaching' | 'training' | 'support';

/**
 * Booking creation response
 */
export interface BookingResponse {
  success: boolean;
  booking?: Booking;
  error?: string;
}

/**
 * Order creation response
 */
export interface OrderResponse {
  success: boolean;
  order?: Order;
  payment?: {
    paymentId?: string;
    status?: string;
  };
  error?: string;
}

/**
 * Order list filter options
 */
export interface OrderListOptions {
  userId?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Booking list filter options
 */
export interface BookingListOptions {
  userId?: string;
  serviceId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'scheduledAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
