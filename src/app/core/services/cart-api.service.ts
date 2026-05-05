import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import { Cart, CartItemQuantityRequest } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getCart() {
    return this.http.get<Cart>(`${this.apiUrl}/carrito`);
  }

  upsertItem(productId: number, request: CartItemQuantityRequest) {
    return this.http.put<Cart>(`${this.apiUrl}/carrito/items/${productId}`, request);
  }

  removeItem(productId: number) {
    return this.http.delete<void>(`${this.apiUrl}/carrito/items/${productId}`);
  }

  clear() {
    return this.http.delete<void>(`${this.apiUrl}/carrito/items`);
  }
}

