import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Category } from '../../core/models/category.model';
import { Product, ProductFilters } from '../../core/models/product.model';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ProductApiService } from '../../core/services/product-api.service';
import { SelectOption } from '../../shared/models/select-option.model';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly categoryApi = inject(CategoryApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly filtersState = signal<ProductFilters>({ page: 0, size: 10, sort: 'name,asc' });

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly categoriesLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalElements = signal(0);
  readonly page = computed(() => this.filtersState().page ?? 0);
  readonly size = computed(() => this.filtersState().size ?? 10);
  readonly filters = computed(() => this.filtersState());

  readonly categoryOptions = computed<SelectOption<string>[]>(() => {
    return this.categories().map(category => ({ label: category.name, value: category.name }));
  });

  load(overrides: ProductFilters = {}): void {
    this.filtersState.update(filters => ({ ...filters, ...overrides }));
    this.loading.set(true);
    this.error.set(null);

    this.productApi.list(this.filtersState())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.products.set(response.content);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los productos. Verifica que el backend este encendido.');
          this.loading.set(false);
        },
      });
  }

  loadCategories(): void {
    this.categoriesLoading.set(true);

    this.categoryApi.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: categories => {
          this.categories.set(categories);
          this.categoriesLoading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las categorias.');
          this.categoriesLoading.set(false);
        },
      });
  }

  applyFilters(filters: Omit<ProductFilters, 'page' | 'size'>): void {
    this.load({ ...filters, page: 0 });
  }

  setPage(page: number, size: number): void {
    this.load({ page, size });
  }

  reload(): void {
    this.load();
  }
}
