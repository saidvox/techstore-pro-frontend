import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import { Order, OrderFilters, OrderStatusUpdateRequest } from '../models/order.model';
import { PageResponse } from '../models/page.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  confirmFromCart() {
    return this.http.post<Order>(`${this.apiUrl}/pedidos`, {});
  }

  list(filters: OrderFilters = {}) {
    return this.http.get<PageResponse<Order>>(`${this.apiUrl}/pedidos`, {
      params: toHttpParams(filters),
    });
  }

  detail(id: number) {
    return this.http.get<Order>(`${this.apiUrl}/pedidos/${id}`);
  }

  updateStatus(id: number, request: OrderStatusUpdateRequest) {
    return this.http.patch<Order>(`${this.apiUrl}/pedidos/${id}/status`, request);
  }

}
