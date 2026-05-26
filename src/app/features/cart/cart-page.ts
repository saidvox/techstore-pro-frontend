import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CartStore } from './cart.store';
import { AuthSessionService } from '../../core/services/auth-session.service';

const CAT_ICON: Record<string, string> = {
  'Laptops':'pi pi-desktop','Smartphones':'pi pi-mobile','Monitores':'pi pi-desktop',
  'Tablets':'pi pi-tablet','Teclados':'pi pi-keyboard','Mouse':'pi pi-arrows-alt',
  'Audifonos':'pi pi-headphones','Almacenamiento':'pi pi-database','Componentes':'pi pi-cog',
  'Camaras':'pi pi-camera','Impresoras':'pi pi-print',
};
const CAT_COLOR: Record<string, string> = {
  'Laptops':'#6C63FF','Smartphones':'#10B981','Monitores':'#F59E0B','Tablets':'#3B82F6',
  'Teclados':'#8B5CF6','Mouse':'#EC4899','Audifonos':'#14B8A6','Almacenamiento':'#F97316',
  'Componentes':'#EF4444','Camaras':'#A78BFA','Impresoras':'#34D399',
};

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  styles: [`
    .page-wrap { min-height: 100vh; background: var(--ts-surface); }
    .page-header {
      background: var(--ts-surface-2);
      border-bottom: 1px solid var(--ts-border);
      padding: 1.25rem 1.5rem;
    }
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }
    @media(max-width: 900px){ .layout{ grid-template-columns:1fr; } }

    /* ── Item row ─────────────────────────────────────────── */
    .item-row {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 16px;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      transition: border-color .2s, box-shadow .2s;
    }
    .item-row:hover { border-color: var(--ts-brand); box-shadow: 0 0 20px rgba(108,99,255,.12); }
    .item-img {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 2rem;
    }
    .item-body { flex:1; min-width:0; }
    .item-name { font-weight:800; font-size:0.95rem; color:var(--ts-text); margin-bottom:0.2rem; }
    .item-cat  { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; }
    .item-unit { font-size:0.8rem; color:var(--ts-text-muted); margin-top:0.3rem; }

    .qty-row   { display:flex; align-items:center; gap:0.5rem; margin-top:0.75rem; }
    .qty-btn {
      width:30px; height:30px; border-radius:8px;
      border:1px solid var(--ts-border); background:var(--ts-surface-2);
      color:var(--ts-text-muted); cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition: all .18s; font-family:inherit;
    }
    .qty-btn:hover:not(:disabled){ border-color:var(--ts-brand); color:var(--ts-brand); }
    .qty-btn:disabled{ opacity:.3; cursor:not-allowed; }
    .qty-num{ min-width:30px; text-align:center; font-weight:800; color:var(--ts-text); }

    .item-right{ display:flex; flex-direction:column; align-items:flex-end; justify-content:space-between; flex-shrink:0; }
    .item-sub  { font-weight:800; font-size:1.1rem; color:var(--ts-text); }
    .del-btn{
      background:none; border:none; cursor:pointer;
      color:var(--ts-text-dim); padding:4px 6px; border-radius:8px;
      display:flex; align-items:center; gap:0.3rem; font-size:0.78rem;
      font-family:inherit; transition: color .18s, background .18s;
    }
    .del-btn:hover{ color:#EF4444; background:rgba(239,68,68,.1); }

    /* ── Summary box ──────────────────────────────────────── */
    .summary-box {
      position:sticky; top:80px;
      background:var(--ts-card); border:1px solid var(--ts-border);
      border-radius:16px; padding:1.5rem;
      display:flex; flex-direction:column; gap:1rem;
    }
    .summary-row{ display:flex; justify-content:space-between; align-items:center; }
    .summary-label{ font-size:.875rem; color:var(--ts-text-muted); }
    .summary-val  { font-size:.875rem; font-weight:700; color:var(--ts-text); }
    .summary-divider{ border:none; border-top:1px solid var(--ts-border); margin:0; }
    .summary-total-label{ font-weight:800; font-size:1rem; color:var(--ts-text); }
    .summary-total-val  { font-weight:900; font-size:1.4rem; color:var(--ts-brand); }

    .btn-main{
      width:100%; padding:.9rem; border-radius:12px;
      background:var(--ts-gradient-brand); color:#fff;
      font-family:'Outfit',sans-serif; font-weight:800; font-size:1rem;
      border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      transition: opacity .2s, transform .15s;
    }
    .btn-main:hover{ opacity:.88; transform:translateY(-1px); }
    .btn-secondary{
      width:100%; padding:.75rem; border-radius:12px;
      background:transparent; border:1px solid var(--ts-border-light);
      color:var(--ts-text-muted); font-family:'Outfit',sans-serif;
      font-weight:700; font-size:.875rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.5rem;
      text-decoration:none; transition: border-color .2s, color .2s;
    }
    .btn-secondary:hover{ border-color:var(--ts-brand); color:var(--ts-text); }
    .btn-danger{
      width:100%; padding:.65rem; border-radius:10px;
      background:transparent; border:1px solid rgba(239,68,68,.3);
      color:#EF4444; font-family:'Outfit',sans-serif;
      font-weight:700; font-size:.8rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center; gap:.4rem;
      transition: background .18s;
    }
    .btn-danger:hover{ background:rgba(239,68,68,.1); }

    /* empty */
    .empty-wrap{
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; padding:5rem 1rem; gap:1.5rem; text-align:center;
    }
    .empty-icon{
      width:90px; height:90px; border-radius:50%;
      background:rgba(108,99,255,.1);
      display:flex; align-items:center; justify-content:center;
      font-size:2.5rem; color:var(--ts-brand);
    }

    /* perks */
    .perk{ display:flex; align-items:center; gap:.5rem; font-size:.8rem; color:var(--ts-text-muted); }

    .cart-title-row,
    .cart-list-head {
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .page-header {
        padding: 1rem;
      }
      .layout {
        gap: 1rem;
      }
      .cart-title-row,
      .cart-list-head {
        align-items: flex-start;
        flex-direction: column;
      }
      .cart-list-head .btn-danger {
        width: 100% !important;
      }
      .item-row {
        border-radius: 14px;
        display: grid;
        gap: 0.85rem;
        grid-template-columns: 64px 1fr;
        padding: 1rem;
      }
      .item-img {
        font-size: 1.45rem;
        height: 64px;
        width: 64px;
      }
      .item-right {
        align-items: center;
        border-top: 1px solid var(--ts-border);
        flex-direction: row;
        grid-column: 1 / -1;
        justify-content: space-between;
        padding-top: 0.75rem;
      }
      .item-sub {
        font-size: 1rem;
      }
      .qty-row {
        flex-wrap: wrap;
      }
      .qty-btn {
        height: 36px;
        width: 36px;
      }
      .summary-box {
        border-radius: 14px;
        padding: 1rem;
        position: static;
      }
      .summary-row {
        gap: 1rem;
      }
      .summary-total-val {
        font-size: 1.2rem;
      }
      .btn-main,
      .btn-secondary,
      .btn-danger {
        min-height: 44px;
      }
    }
  `],
  template: `
  <div class="page-wrap">

    <!-- Page header -->
    <div class="page-header">
      <div class="cart-title-row max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color:var(--ts-brand);">Compra</p>
          <h1 class="text-3xl font-black" style="color:var(--ts-text);">Mi carrito</h1>
        </div>
        @if (!cart.isEmpty()) {
          <span class="text-sm font-semibold px-3 py-1 rounded-full"
            style="background:rgba(108,99,255,.12); color:var(--ts-brand); border:1px solid rgba(108,99,255,.3);">
            {{ cart.itemCount() }} {{ cart.itemCount() === 1 ? 'artículo' : 'artículos' }}
          </span>
        }
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6">

      <!-- ── CARRITO VACÍO ──────────────────────────────── -->
      @if (cart.isEmpty()) {
        <div class="empty-wrap">
          <div class="empty-icon"><i class="pi pi-shopping-cart"></i></div>
          <div>
            <h2 class="text-2xl font-black mb-2" style="color:var(--ts-text);">Tu carrito está vacío</h2>
            <p class="text-base" style="color:var(--ts-text-muted);">
              Agrega productos desde el catálogo para comenzar tu compra.
            </p>
          </div>
          <a routerLink="/catalogo" class="btn-main" style="width:auto; padding:.75rem 2rem; text-decoration:none;">
            <i class="pi pi-th-large text-sm"></i> Explorar catálogo
          </a>
        </div>
      }

      <!-- ── CARRITO CON ÍTEMS ───────────────────────────── -->
      @if (!cart.isEmpty()) {
        <div class="layout">

          <!-- Lista de productos -->
          <div style="display:flex; flex-direction:column; gap:1rem;">

            <!-- Cabecera lista -->
            <div class="cart-list-head flex items-center justify-between">
              <h2 class="text-lg font-black" style="color:var(--ts-text);">
                Productos seleccionados
              </h2>
              <button class="btn-danger" style="width:auto; padding:.5rem 1rem;" (click)="cart.clear()">
                <i class="pi pi-trash text-xs"></i> Vaciar carrito
              </button>
            </div>

            <!-- Items -->
            @for (item of cart.localItems(); track item.productId) {
              <div class="item-row">
                <!-- Ícono -->
                <div class="item-img" [style.background]="color(item.category)+'1A'">
                  <i [class]="icon(item.category)" [style.color]="color(item.category)"></i>
                </div>

                <!-- Info -->
                <div class="item-body">
                  <p class="item-cat" [style.color]="color(item.category)">{{ item.category }}</p>
                  <p class="item-name">{{ item.productName }}</p>
                  <p class="item-unit">S/ {{ item.unitPrice | number:'1.2-2' }} por unidad</p>

                  <div class="qty-row">
                    <button class="qty-btn" (click)="cart.decrease(item.productId)" aria-label="Menos">
                      <i class="pi pi-minus" style="font-size:.6rem;"></i>
                    </button>
                    <span class="qty-num">{{ item.quantity }}</span>
                    <button class="qty-btn"
                      [disabled]="item.quantity >= item.availableStock"
                      (click)="cart.increase(item.productId)" aria-label="Más">
                      <i class="pi pi-plus" style="font-size:.6rem;"></i>
                    </button>
                    <span class="text-xs ml-1" style="color:var(--ts-text-dim);">
                      {{ item.availableStock }} disponibles
                    </span>
                  </div>
                </div>

                <!-- Subtotal + eliminar -->
                <div class="item-right">
                  <span class="item-sub">S/ {{ (item.unitPrice * item.quantity) | number:'1.2-2' }}</span>
                  <button class="del-btn" (click)="cart.removeLocal(item.productId)">
                    <i class="pi pi-trash"></i> Quitar
                  </button>
                </div>
              </div>
            }

            <!-- Continuar comprando -->
            <a routerLink="/catalogo" class="btn-secondary" style="margin-top:.5rem;">
              <i class="pi pi-arrow-left text-sm"></i> Seguir comprando
            </a>
          </div>

          <!-- Resumen del pedido -->
          <div class="summary-box">
            <p class="text-sm font-bold uppercase tracking-widest" style="color:var(--ts-brand);">
              Resumen del pedido
            </p>

            <div style="display:flex; flex-direction:column; gap:.75rem;">
              <div class="summary-row">
                <span class="summary-label">Subtotal ({{ cart.itemCount() }} art.)</span>
                <span class="summary-val">S/ {{ cart.total() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Envío</span>
                <span style="font-size:.875rem; font-weight:700; color:#10B981;">Gratis</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Descuento</span>
                <span style="font-size:.875rem; font-weight:700; color:#F59E0B;">—</span>
              </div>
            </div>

            <hr class="summary-divider">

            <div class="summary-row">
              <span class="summary-total-label">Total a pagar</span>
              <span class="summary-total-val">S/ {{ cart.total() | number:'1.2-2' }}</span>
            </div>

            <button class="btn-main" (click)="checkout()" [disabled]="cart.loading()">
              @if (cart.loading()) {
                <i class="pi pi-spinner animate-spin text-sm"></i> Procesando...
              } @else {
                <i class="pi pi-lock text-sm"></i> Finalizar compra
              }
            </button>

            <!-- Perks de confianza -->
            <div style="display:flex; flex-direction:column; gap:.5rem; padding-top:.25rem;">
              <div class="perk"><i class="pi pi-shield text-xs" style="color:#10B981;"></i> Pago 100% seguro</div>
              <div class="perk"><i class="pi pi-truck text-xs" style="color:#10B981;"></i> Envío gratis en todos los pedidos</div>
              <div class="perk"><i class="pi pi-refresh text-xs" style="color:#10B981;"></i> Devolución gratuita en 30 días</div>
            </div>
          </div>

        </div>
      }
    </div>
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  readonly cart    = inject(CartStore);
  private readonly session = inject(AuthSessionService);
  private readonly router  = inject(Router);

  icon(cat: string): string  { return CAT_ICON[cat]  ?? 'pi pi-box'; }
  color(cat: string): string { return CAT_COLOR[cat] ?? '#6C63FF'; }

  checkout(): void {
    if (this.session.user()) {
      this.cart.checkoutFlow();
    } else {
      void this.router.navigate(['/auth/login'], { queryParams: { redirect: '/carrito' } });
    }
  }
}
