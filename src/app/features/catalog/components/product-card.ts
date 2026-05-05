import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';

import { Product } from '../../../core/models/product.model';
import { CartStore } from '../../cart/cart.store';

// Mapa de íconos y colores por categoría
const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  'Laptops':      { icon: 'pi pi-desktop',    color: '#6C63FF', bg: 'rgba(108,99,255,0.12)' },
  'Smartphones':  { icon: 'pi pi-mobile',     color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  'Accesorios':   { icon: 'pi pi-headphones', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'Tablets':      { icon: 'pi pi-tablet',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  'Monitores':    { icon: 'pi pi-desktop',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  'Gaming':       { icon: 'pi pi-star',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  'Audio':        { icon: 'pi pi-volume-up',  color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  'Camaras':      { icon: 'pi pi-camera',     color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
};

const DEFAULT_CONFIG = { icon: 'pi pi-box', color: '#6C63FF', bg: 'rgba(108,99,255,0.12)' };

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe, ButtonModule],
  template: `
    <article
      class="ts-card ts-fade-up flex flex-col overflow-hidden cursor-pointer group"
      style="height: 100%;"
    >
      <!-- Zona imagen / ícono -->
      <div
        class="relative flex items-center justify-center"
        style="height: 160px; background: var(--ts-surface-2);"
      >
        <!-- Ícono de categoría -->
        <div
          class="size-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          [style.background]="catConfig().bg"
        >
          <i
            [class]="catConfig().icon + ' text-4xl'"
            [style.color]="catConfig().color"
          ></i>
        </div>

        <!-- Badge stock -->
        <div class="absolute top-3 right-3">
          @if (product().stock === 0) {
            <span class="ts-badge ts-badge-danger">Sin stock</span>
          } @else if (product().stock <= 5) {
            <span class="ts-badge ts-badge-warn">Stock bajo</span>
          } @else {
            <span class="ts-badge ts-badge-success">Disponible</span>
          }
        </div>

        <!-- Badge categoría -->
        <div class="absolute top-3 left-3">
          <span
            class="ts-badge"
            [style.background]="catConfig().bg"
            [style.color]="catConfig().color"
          >
            {{ product().category }}
          </span>
        </div>
      </div>

      <!-- Contenido -->
      <div class="flex flex-col flex-1 p-4 gap-3">
        <div class="flex-1">
          <h3 class="font-bold text-sm leading-snug line-clamp-2 mb-1" style="color: var(--ts-text);">
            {{ product().name }}
          </h3>
          <p class="text-xs leading-relaxed line-clamp-2" style="color: var(--ts-text-muted);">
            {{ product().description }}
          </p>
        </div>

        <!-- Precio + botón -->
        <div class="flex items-center justify-between gap-2 mt-auto">
          <div>
            <p class="text-xs font-medium" style="color: var(--ts-text-dim);">Precio</p>
            <p class="text-xl font-black" style="color: var(--ts-text);">
              S/ {{ product().price | number:'1.2-2' }}
            </p>
          </div>

          <button
            class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
            [style.background]="product().stock > 0 ? catConfig().color : '#4A4A6A'"
            [disabled]="product().stock === 0"
            (click)="onAddToCart()"
            aria-label="Agregar al carrito"
          >
            <i class="pi pi-shopping-cart text-xs"></i>
            Agregar
          </button>
        </div>
      </div>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly added = output<Product>();

  private readonly cart = inject(CartStore);

  catConfig() {
    return CATEGORY_CONFIG[this.product().category] ?? DEFAULT_CONFIG;
  }

  onAddToCart(): void {
    if (this.product().stock === 0) return;
    this.cart.addProduct(this.product());
    this.cart.openSidebar();
    this.added.emit(this.product());
  }
}
