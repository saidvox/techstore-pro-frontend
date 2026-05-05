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
  stock: number;
  active: boolean;
}

export interface ProductRequest {
  name: string;
  categoryId?: number | null;
  category?: string;
  description: string;
  imageUrl?: string | null;
  price: number;
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
