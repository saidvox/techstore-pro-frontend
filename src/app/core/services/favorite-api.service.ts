import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class FavoriteApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  list() {
    return this.http.get<Product[]>(`${this.apiUrl}/favoritos`);
  }

  add(productId: number) {
    return this.http.post<Product>(`${this.apiUrl}/favoritos/${productId}`, {});
  }

  remove(productId: number) {
    return this.http.delete<void>(`${this.apiUrl}/favoritos/${productId}`);
  }
}
