import { PageQuery } from './page.model';
import { User } from './user.model';

export type OrderStatus = 'CONFIRMED' | 'CANCELLED' | 'DELIVERED';
export type OrderScope = 'mine' | 'all';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  user: User;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderFilters extends PageQuery {
  scope?: OrderScope;
  status?: OrderStatus;
  userName?: string;
  userEmail?: string;
  productName?: string;
  productId?: number;
  from?: string;
  to?: string;
  minTotal?: number;
  maxTotal?: number;
}

export interface OrderStatusUpdateRequest {
  status: OrderStatus;
}

