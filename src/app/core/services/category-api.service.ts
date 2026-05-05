import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import { Category, CategoryRequest } from '../models/category.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  list(includeInactive = false) {
    return this.http.get<Category[]>(`${this.apiUrl}/categorias`, {
      params: toHttpParams({ includeInactive }),
    });
  }

  create(request: CategoryRequest) {
    return this.http.post<Category>(`${this.apiUrl}/categorias`, request);
  }

  update(id: number, request: CategoryRequest) {
    return this.http.put<Category>(`${this.apiUrl}/categorias/${id}`, request);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/categorias/${id}`);
  }
}
