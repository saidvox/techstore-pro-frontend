import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import { PageResponse } from '../models/page.model';
import { Product, ProductFilters, ProductRequest } from '../models/product.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  list(filters: ProductFilters = {}) {
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/productos`, {
      params: toHttpParams(filters),
    });
  }

  detail(id: number) {
    return this.http.get<Product>(`${this.apiUrl}/productos/${id}`);
  }

  create(request: ProductRequest) {
    return this.http.post<Product>(`${this.apiUrl}/productos`, request);
  }

  update(id: number, request: ProductRequest) {
    return this.http.put<Product>(`${this.apiUrl}/productos/${id}`, request);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/productos/${id}`);
  }

}
