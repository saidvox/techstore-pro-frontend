import { Order } from './order.model';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PaymentProvider = 'MERCADO_PAGO_SIMULATED' | 'MERCADO_PAGO';

export interface Payment {
  id: number;
  externalReference: string;
  preferenceId: string | null;
  externalPaymentId: string | null;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  checkoutUrl: string;
  initPoint: string | null;
  detail: string | null;
  createdAt: string;
  updatedAt: string;
  order: Order;
}

export interface CheckoutResponse {
  externalReference: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  checkoutUrl: string;
  order: Order;
}
