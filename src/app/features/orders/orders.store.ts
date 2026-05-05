import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Order, OrderFilters, OrderStatus } from '../../core/models/order.model';
import { OrderApiService } from '../../core/services/order-api.service';
import { SelectOption } from '../../shared/models/select-option.model';

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly orderApi = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly filtersState = signal<OrderFilters>({ scope: 'mine', page: 0, size: 10 });

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalElements = signal(0);
  readonly page = computed(() => this.filtersState().page ?? 0);
  readonly size = computed(() => this.filtersState().size ?? 10);
  readonly filters = computed(() => this.filtersState());

  readonly statusOptions: SelectOption<OrderStatus>[] = [
    { label: 'Confirmado', value: 'CONFIRMED' },
    { label: 'Cancelado', value: 'CANCELLED' },
    { label: 'Entregado', value: 'DELIVERED' },
  ];

  load(overrides: OrderFilters = {}): void {
    this.filtersState.update(filters => ({ ...filters, ...overrides }));
    this.loading.set(true);
    this.error.set(null);

    this.orderApi.list(this.filtersState())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.orders.set(response.content);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los pedidos.');
          this.loading.set(false);
        },
      });
  }

  applyFilters(filters: Omit<OrderFilters, 'page' | 'size'>): void {
    this.load({ ...filters, page: 0 });
  }

  setPage(page: number, size: number): void {
    this.load({ page, size });
  }

  confirmFromCart(): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderApi.confirmFromCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: order => {
          this.orders.update(orders => [order, ...orders]);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo confirmar el pedido.');
          this.loading.set(false);
        },
      });
  }

  updateStatus(id: number, status: OrderStatus): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderApi.updateStatus(id, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.orders.update(orders => orders.map(order => order.id === updated.id ? updated : order));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo actualizar el estado del pedido.');
          this.loading.set(false);
        },
      });
  }
}

