import { PageQuery } from './page.model';

export type ProductStockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';

export interface Product {
  id: number;
  name: string;
  categoryId: number | null;
  category: string;
  description: string;
  imageUrl: string | null;
  price: number;
  offerPrice?: number | null;
  offerStartsAt?: string | null;
  offerEndsAt?: string | null;
  onOffer?: boolean;
  effectivePrice?: number;
  discountPercentage?: number | null;
  stock: number;
  active: boolean;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  name: string;
  categoryId?: number | null;
  category?: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  offerPrice?: number | null;
  offerStartsAt?: string | null;
  offerEndsAt?: string | null;
  stock: number;
  active: boolean;
}

export interface ProductFilters extends PageQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: ProductStockStatus;
  active?: boolean;
  includeInactive?: boolean;
  createdFrom?: string;
  createdTo?: string;
}
