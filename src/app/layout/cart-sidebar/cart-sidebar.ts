import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { CartStore } from '../../features/cart/cart.store';

const CATEGORY_ICONS: Record<string, string> = {
  'Laptops':      'pi pi-desktop',
  'Smartphones':  'pi pi-mobile',
  'Accesorios':   'pi pi-headphones',
  'Tablets':      'pi pi-tablet',
  'Monitores':    'pi pi-desktop',
  'Gaming':       'pi pi-gamepad',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Laptops':      '#6C63FF',
  'Smartphones':  '#10B981',
  'Accesorios':   '#F59E0B',
  'Tablets':      '#3B82F6',
  'Monitores':    '#8B5CF6',
  'Gaming':       '#EF4444',
};

@Component({
  selector: 'app-cart-sidebar',
  imports: [DecimalPipe, ButtonModule, DrawerModule],
  template: `
    <p-drawer
      [visible]="cart.sidebarOpen()"
      header="Mi carrito"
      position="right"
      [style]="{ width: '400px' }"
      [modal]="true"
      (onHide)="cart.closeSidebar()"
    >
      <ng-template #header>
        <div class="flex items-center gap-3">
          <i class="pi pi-shopping-cart text-[var(--ts-brand)]"></i>
          <span class="font-bold text-lg text-[var(--ts-text)]">Mi carrito</span>
          @if (!cart.isEmpty()) {
            <span class="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--ts-brand)] text-white">
              {{ cart.itemCount() }}
            </span>
          }
        </div>
      </ng-template>

      <!-- Carrito vacío -->
      @if (cart.isEmpty()) {
        <div class="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div class="size-16 rounded-full bg-[var(--ts-surface-2)] flex items-center justify-center">
            <i class="pi pi-shopping-cart text-2xl text-[var(--ts-text-dim)]"></i>
          </div>
          <p class="text-[var(--ts-text-muted)] font-medium">Tu carrito esta vacio</p>
          <p-button
            label="Ver catalogo"
            icon="pi pi-arrow-right"
            iconPos="right"
            [text]="true"
            (onClick)="goToCatalog()"
          />
        </div>
      }

      <!-- Lista de items -->
      @if (!cart.isEmpty()) {
        <div class="flex flex-col gap-3 py-2">
          @for (item of cart.localItems(); track item.productId) {
            <div class="flex items-center gap-3 p-3 rounded-xl border border-[var(--ts-border)] bg-[var(--ts-card)] transition-colors hover:border-[var(--ts-brand)]">

              <!-- Icono de categoria -->
              <div
                class="size-12 rounded-lg flex items-center justify-center flex-shrink-0"
                [style.background]="getCategoryColor(item.category) + '22'"
              >
                <i
                  [class]="getCategoryIcon(item.category)"
                  [style.color]="getCategoryColor(item.category)"
                ></i>
              </div>

              <!-- Info producto -->
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-[var(--ts-text)] truncate">{{ item.productName }}</p>
                <p class="text-xs text-[var(--ts-text-muted)] mt-0.5">S/ {{ item.unitPrice | number:'1.2-2' }}</p>
              </div>

              <!-- Controles cantidad -->
              <div class="flex items-center gap-1">
                <button
                  class="size-7 rounded-md flex items-center justify-center border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:border-[var(--ts-brand)] hover:text-[var(--ts-brand)] transition-colors"
                  (click)="cart.decrease(item.productId)"
                  aria-label="Disminuir cantidad"
                >
                  <i class="pi pi-minus text-xs"></i>
                </button>
                <span class="w-7 text-center text-sm font-bold text-[var(--ts-text)]">{{ item.quantity }}</span>
                <button
                  class="size-7 rounded-md flex items-center justify-center border border-[var(--ts-border)] text-[var(--ts-text-muted)] hover:border-[var(--ts-brand)] hover:text-[var(--ts-brand)] transition-colors"
                  [disabled]="item.quantity >= item.availableStock"
                  (click)="cart.increase(item.productId)"
                  aria-label="Aumentar cantidad"
                >
                  <i class="pi pi-plus text-xs"></i>
                </button>
              </div>

              <!-- Subtotal + eliminar -->
              <div class="flex flex-col items-end gap-1">
                <span class="text-sm font-bold text-[var(--ts-text)]">
                  S/ {{ (item.unitPrice * item.quantity) | number:'1.2-2' }}
                </span>
                <button
                  class="text-[var(--ts-text-dim)] hover:text-red-400 transition-colors"
                  (click)="cart.removeLocal(item.productId)"
                  aria-label="Eliminar producto"
                >
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Footer: total + CTA -->
      <ng-template #footer>
        @if (!cart.isEmpty()) {
          <div class="flex flex-col gap-3">
            <!-- Resumen -->
            <div class="flex items-center justify-between py-3 border-t border-[var(--ts-border)]">
              <span class="font-semibold text-[var(--ts-text-muted)]">Total</span>
              <span class="text-xl font-black text-[var(--ts-text)]">
                S/ {{ cart.total() | number:'1.2-2' }}
              </span>
            </div>

            <!-- CTA principal -->
            <p-button
              label="Finalizar compra"
              icon="pi pi-lock"
              styleClass="w-full"
              (onClick)="checkout()"
            />

            <!-- Seguir comprando -->
            <p-button
              label="Seguir comprando"
              styleClass="w-full"
              [outlined]="true"
              (onClick)="cart.closeSidebar()"
            />
          </div>
        }
      </ng-template>
    </p-drawer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartSidebar {
  readonly cart = inject(CartStore);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);

  getCategoryIcon(category: string): string {
    return CATEGORY_ICONS[category] ?? 'pi pi-box';
  }

  getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category] ?? '#6C63FF';
  }

  goToCatalog(): void {
    this.cart.closeSidebar();
    void this.router.navigateByUrl('/catalogo');
  }

  checkout(): void {
    this.cart.closeSidebar();
    if (this.session.user()) {
      void this.router.navigateByUrl('/carrito');
    } else {
      void this.router.navigate(['/auth/login'], {
        queryParams: { redirect: '/carrito' },
      });
    }
  }
}
