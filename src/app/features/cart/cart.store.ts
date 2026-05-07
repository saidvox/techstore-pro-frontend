import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Cart } from '../../core/models/cart.model';
import { Product } from '../../core/models/product.model';
import { CartApiService } from '../../core/services/cart-api.service';
import { PaymentApiService } from '../../core/services/payment-api.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { from } from 'rxjs';
import { concatMap, toArray, switchMap } from 'rxjs/operators';

export interface LocalCartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartApi = inject(CartApiService);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  // ─── API Cart (usuarios autenticados) ─────────────────────
  readonly cart = signal<Cart>({ items: [], total: 0 });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ─── Carrito local (invitados + autenticados) ─────────────
  private readonly _localItems = signal<LocalCartItem[]>([]);
  private readonly _sidebarOpen = signal(false);

  readonly localItems = this._localItems.asReadonly();
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  readonly items = computed(() => this.cart().items);
  readonly total = computed(() =>
    this._localItems().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  );
  readonly itemCount = computed(() =>
    this._localItems().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly isEmpty = computed(() => this._localItems().length === 0);

  // ─── Sidebar ──────────────────────────────────────────────
  openSidebar(): void { this._sidebarOpen.set(true); }
  closeSidebar(): void { this._sidebarOpen.set(false); }
  toggleSidebar(): void { this._sidebarOpen.update(v => !v); }

  // ─── Agregar producto (carrito local) ────────────────────
  addProduct(product: Product): void {
    this._localItems.update(items => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return items;
        return items.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...items, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        availableStock: product.stock,
        category: product.category,
      }];
    });
  }

  increase(productId: number): void {
    this._localItems.update(items =>
      items.map(i => {
        if (i.productId !== productId) return i;
        return i.quantity < i.availableStock ? { ...i, quantity: i.quantity + 1 } : i;
      })
    );
  }

  decrease(productId: number): void {
    this._localItems.update(items =>
      items
        .map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
    );
  }

  removeLocal(productId: number): void {
    this._localItems.update(items => items.filter(i => i.productId !== productId));
  }

  // ─── API Cart methods (checkout autenticado) ─────────────
  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartApi.getCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cart => {
          this.cart.set(cart);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el carrito.');
          this.loading.set(false);
        },
      });
  }

  setQuantity(productId: number, quantity: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartApi.upsertItem(productId, { quantity })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cart => {
          this.cart.set(cart);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo actualizar el carrito.');
          this.loading.set(false);
        },
      });
  }

  remove(productId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.cartApi.removeItem(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cart.update(cart => ({
            items: cart.items.filter(item => item.productId !== productId),
            total: cart.items
              .filter(item => item.productId !== productId)
              .reduce((total, item) => total + item.subtotal, 0),
          }));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo quitar el producto.');
          this.loading.set(false);
        },
      });
  }

  clear(): void {
    this._localItems.set([]);
    this.loading.set(true);
    this.error.set(null);

    this.cartApi.clear()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cart.set({ items: [], total: 0 });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo vaciar el carrito.');
          this.loading.set(false);
        },
      });
  }

  checkoutFlow(): void {
    const items = this._localItems();
    if (items.length === 0) return;

    this.loading.set(true);
    this.error.set(null);

    // Vaciar primero el carrito del backend por si había algo viejo, o simplemente sobreescribir.
    // Como upsertItem agrega/actualiza, para estar seguros podemos vaciarlo primero,
    // pero upsert sirve. Vamos directo al from.
    this.cartApi.clear().pipe(
      switchMap(() => from(items).pipe(
        concatMap(item => this.cartApi.upsertItem(item.productId, { quantity: item.quantity })),
        toArray()
      )),
      switchMap(() => this.paymentApi.startMercadoPagoSimulation()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: checkout => {
        this._localItems.set([]);
        this.cart.set({ items: [], total: 0 });
        this.loading.set(false);
        this.messageService.add({ 
          severity: 'success', 
          summary: '¡Pedido exitoso!', 
          detail: 'Tu orden ha sido procesada correctamente.',
          life: 4000
        });
        window.location.assign(checkout.checkoutUrl);
      },
      error: () => {
        this.error.set('Ocurrió un error al procesar tu pedido. Intenta nuevamente.');
        this.loading.set(false);
      }
    });
  }
}
