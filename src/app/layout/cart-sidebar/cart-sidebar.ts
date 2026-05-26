import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { CartStore } from '../../features/cart/cart.store';

const CAT_ICON: Record<string, string> = {
  'Laptops':        'pi pi-desktop',
  'Smartphones':    'pi pi-mobile',
  'Monitores':      'pi pi-desktop',
  'Tablets':        'pi pi-tablet',
  'Teclados':       'pi pi-keyboard',
  'Mouse':          'pi pi-arrows-alt',
  'Audifonos':      'pi pi-headphones',
  'Almacenamiento': 'pi pi-database',
  'Componentes':    'pi pi-cog',
  'Camaras':        'pi pi-camera',
  'Impresoras':     'pi pi-print',
};
const CAT_COLOR: Record<string, string> = {
  'Laptops':        '#6C63FF',
  'Smartphones':    '#10B981',
  'Monitores':      '#F59E0B',
  'Tablets':        '#3B82F6',
  'Teclados':       '#8B5CF6',
  'Mouse':          '#EC4899',
  'Audifonos':      '#14B8A6',
  'Almacenamiento': '#F97316',
  'Componentes':    '#EF4444',
  'Camaras':        '#A78BFA',
  'Impresoras':     '#34D399',
};

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [DecimalPipe, DrawerModule],
  styles: [`
    /* ── Drawer overrides ─────────────────────────────────── */
    ::ng-deep .ts-cart-drawer .p-drawer {
      background: var(--ts-card) !important;
      border-left: 1px solid var(--ts-border) !important;
    }
    ::ng-deep .ts-cart-drawer .p-drawer-header {
      background: var(--ts-surface-2) !important;
      border-bottom: 1px solid var(--ts-border) !important;
      padding: 1rem 1.25rem !important;
    }
    ::ng-deep .ts-cart-drawer .p-drawer-content {
      background: var(--ts-card) !important;
      padding: 1rem 1.25rem !important;
    }
    ::ng-deep .ts-cart-drawer .p-drawer-footer {
      background: var(--ts-surface-2) !important;
      border-top: 1px solid var(--ts-border) !important;
      padding: 1rem 1.25rem !important;
    }

    /* ── Item card ─────────────────────────────────────────── */
    .cart-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem;
      border-radius: 14px;
      border: 1px solid var(--ts-border);
      background: var(--ts-surface-2);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .cart-item:hover { border-color: var(--ts-brand); box-shadow: 0 0 14px rgba(108,99,255,0.12); }

    .item-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.25rem;
    }
    .item-info { flex: 1; min-width: 0; }
    .item-name {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--ts-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-price { font-size: 0.75rem; color: var(--ts-text-muted); margin-top: 2px; }

    /* Qty controls */
    .qty-wrap { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; }
    .qty-btn {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      border: 1px solid var(--ts-border);
      background: var(--ts-card);
      color: var(--ts-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.18s;
      font-family: inherit;
    }
    .qty-btn:hover:not(:disabled) { border-color: var(--ts-brand); color: var(--ts-brand); }
    .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .qty-num {
      min-width: 28px;
      text-align: center;
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--ts-text);
    }

    .item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
    .item-subtotal { font-weight: 800; font-size: 0.9rem; color: var(--ts-text); }
    .del-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ts-text-dim);
      padding: 2px;
      border-radius: 6px;
      transition: color 0.18s, background 0.18s;
      display: flex;
      align-items: center;
    }
    .del-btn:hover { color: #EF4444; background: rgba(239,68,68,0.1); }

    /* ── Empty state ───────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 3rem 1rem;
      text-align: center;
    }
    .empty-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(108,99,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      color: var(--ts-brand);
    }

    /* ── CTA buttons ───────────────────────────────────────── */
    .btn-checkout {
      width: 100%;
      padding: 0.85rem;
      border-radius: 12px;
      background: var(--ts-gradient-brand);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 0.95rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s, transform 0.15s;
    }
    .btn-checkout:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-outline {
      width: 100%;
      padding: 0.75rem;
      border-radius: 12px;
      background: transparent;
      border: 1px solid var(--ts-border-light);
      color: var(--ts-text-muted);
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: border-color 0.2s, color 0.2s;
    }
    .btn-outline:hover { border-color: var(--ts-brand); color: var(--ts-text); }

    @media (max-width: 480px) {
      ::ng-deep .ts-cart-drawer .p-drawer {
        max-width: 100vw !important;
        width: 100vw !important;
      }
      ::ng-deep .ts-cart-drawer .p-drawer-header,
      ::ng-deep .ts-cart-drawer .p-drawer-content,
      ::ng-deep .ts-cart-drawer .p-drawer-footer {
        padding: 1rem !important;
      }
      .cart-item {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 48px 1fr;
      }
      .item-right {
        align-items: center;
        border-top: 1px solid var(--ts-border);
        flex-direction: row;
        grid-column: 1 / -1;
        justify-content: space-between;
        padding-top: 0.65rem;
      }
      .qty-btn {
        height: 34px;
        width: 34px;
      }
      .btn-checkout,
      .btn-outline {
        min-height: 44px;
      }
    }
  `],
  template: `
  <div class="ts-cart-drawer">
    <p-drawer
      [visible]="cart.sidebarOpen()"
      position="right"
      [style]="{ width: '420px', 'max-width': '100vw' }"
      [modal]="true"
      [showCloseIcon]="false"
      (onHide)="cart.closeSidebar()"
    >
      <!-- Header personalizado -->
      <ng-template #header>
        <div class="flex items-center gap-3 w-full">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
            style="background: rgba(108,99,255,0.15);">
            <i class="pi pi-shopping-cart" style="color: var(--ts-brand);"></i>
          </div>
          <div class="flex-1">
            <span class="font-black text-base" style="color: var(--ts-text);">Mi carrito</span>
            @if (!cart.isEmpty()) {
              <span class="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                style="background: var(--ts-brand); color: #fff;">
                {{ cart.itemCount() }}
              </span>
            }
          </div>
          <button class="del-btn p-1" (click)="cart.closeSidebar()" aria-label="Cerrar">
            <i class="pi pi-times text-sm" style="color: var(--ts-text-muted);"></i>
          </button>
        </div>
      </ng-template>

      <!-- Estado vacío -->
      @if (cart.isEmpty()) {
        <div class="empty-state">
          <div class="empty-icon"><i class="pi pi-shopping-cart"></i></div>
          <div>
            <p class="font-bold text-base mb-1" style="color: var(--ts-text);">Tu carrito está vacío</p>
            <p class="text-sm" style="color: var(--ts-text-muted);">Explora el catálogo y añade productos</p>
          </div>
          <button class="btn-checkout" style="width:auto; padding: 0.6rem 1.5rem;" (click)="goToCatalog()">
            <i class="pi pi-th-large text-sm"></i> Ver catálogo
          </button>
        </div>
      }

      <!-- Lista de ítems -->
      @if (!cart.isEmpty()) {
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          @for (item of cart.localItems(); track item.productId) {
            <div class="cart-item">
              <!-- Ícono categoría -->
              <div class="item-icon"
                [style.background]="getCatColor(item.category) + '1A'">
                <i [class]="getCatIcon(item.category)"
                   [style.color]="getCatColor(item.category)"></i>
              </div>

              <!-- Info + qty -->
              <div class="item-info">
                <p class="item-name">{{ item.productName }}</p>
                <p class="item-price">S/ {{ item.unitPrice | number:'1.2-2' }} c/u</p>
                <div class="qty-wrap">
                  <button class="qty-btn" (click)="cart.decrease(item.productId)" aria-label="Menos">
                    <i class="pi pi-minus" style="font-size:0.6rem;"></i>
                  </button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button class="qty-btn"
                    [disabled]="item.quantity >= item.availableStock"
                    (click)="cart.increase(item.productId)"
                    aria-label="Más">
                    <i class="pi pi-plus" style="font-size:0.6rem;"></i>
                  </button>
                  <span class="text-xs ml-1" style="color: var(--ts-text-dim);">
                    / {{ item.availableStock }} disp.
                  </span>
                </div>
              </div>

              <!-- Subtotal + eliminar -->
              <div class="item-right">
                <span class="item-subtotal">S/ {{ (item.unitPrice * item.quantity) | number:'1.2-2' }}</span>
                <button class="del-btn" (click)="cart.removeLocal(item.productId)" aria-label="Eliminar">
                  <i class="pi pi-trash" style="font-size:0.8rem;"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Footer -->
      <ng-template #footer>
        @if (!cart.isEmpty()) {
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <!-- Resumen de precios -->
            <div style="background: var(--ts-surface); border-radius:12px; padding:0.875rem; border:1px solid var(--ts-border);">
              <div class="flex justify-between text-sm mb-2">
                <span style="color: var(--ts-text-muted);">Subtotal ({{ cart.itemCount() }} art.)</span>
                <span style="color: var(--ts-text); font-weight:700;">S/ {{ cart.total() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-sm mb-2">
                <span style="color: var(--ts-text-muted);">Envío</span>
                <span style="color: #10B981; font-weight:700;">Gratis</span>
              </div>
              <div style="border-top:1px solid var(--ts-border); margin: 0.5rem 0;"></div>
              <div class="flex justify-between">
                <span class="font-black" style="color: var(--ts-text);">Total</span>
                <span class="font-black text-xl" style="color: var(--ts-brand);">
                  S/ {{ cart.total() | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <!-- Botón checkout -->
            <button class="btn-checkout" (click)="checkout()">
              <i class="pi pi-lock text-sm"></i>
              Finalizar compra
            </button>

            <!-- Vaciar + seguir -->
            <div class="flex gap-2">
              <button class="btn-outline flex-1" (click)="cart.closeSidebar()">
                <i class="pi pi-arrow-left text-xs"></i> Seguir comprando
              </button>
              <button class="btn-outline" style="color: #EF4444; border-color: rgba(239,68,68,0.3);"
                (click)="cart.clear()">
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </div>
        }
      </ng-template>
    </p-drawer>
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartSidebar {
  readonly cart    = inject(CartStore);
  private readonly session = inject(AuthSessionService);
  private readonly router  = inject(Router);

  getCatIcon(category: string): string  { return CAT_ICON[category]  ?? 'pi pi-box'; }
  getCatColor(category: string): string { return CAT_COLOR[category] ?? '#6C63FF'; }

  goToCatalog(): void {
    this.cart.closeSidebar();
    void this.router.navigateByUrl('/catalogo');
  }

  checkout(): void {
    this.cart.closeSidebar();
    if (this.session.user()) {
      void this.router.navigateByUrl('/carrito');
    } else {
      void this.router.navigate(['/auth/login'], { queryParams: { redirect: '/carrito' } });
    }
  }
}
