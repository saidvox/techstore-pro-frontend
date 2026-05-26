import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';

import { Order, OrderStatus } from '../../core/models/order.model';
import { OrdersStore } from './orders.store';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    DatePipe, DecimalPipe, FormsModule, RouterLink,
    ButtonModule, DialogModule, SelectModule, SkeletonModule
  ],
  styles: [`
    .orders-wrap { min-height: 100vh; background: var(--ts-surface); padding-bottom: 4rem; }
    
    /* ── Header ───────────────────────────────────────── */
    .orders-header {
      background: var(--ts-surface-2);
      border-bottom: 1px solid var(--ts-border);
      padding: 2rem 0;
    }
    
    /* ── Cards de Pedido ──────────────────────────────── */
    .order-list { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 2rem; }
    
    .order-card {
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      transition: all 0.25s;
    }
    .order-card:hover { border-color: var(--ts-brand); box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
    
    .order-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px dashed var(--ts-border);
      padding-bottom: 1rem;
    }
    
    .order-id { font-size: 1.25rem; font-weight: 900; color: var(--ts-text); margin: 0; }
    .order-date { font-size: 0.85rem; color: var(--ts-text-muted); font-weight: 500; display: flex; align-items: center; gap: 0.4rem; }
    
    .order-status {
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    
    .order-body { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
    
    .order-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .order-info-label { font-size: 0.75rem; font-weight: 700; color: var(--ts-text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
    .order-total { font-size: 1.75rem; font-weight: 900; color: var(--ts-text); }
    
    .btn-details {
      background: var(--ts-surface-2);
      border: 1px solid var(--ts-border);
      color: var(--ts-text);
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-details:hover { background: rgba(108,99,255,0.1); border-color: rgba(108,99,255,0.3); color: var(--ts-brand); }
    
    /* ── Empty State ───────────────────────────────────── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 5rem 1rem; text-align: center; gap: 1rem;
    }
    .empty-icon { width: 80px; height: 80px; border-radius: 24px; background: rgba(108,99,255,0.1); display: flex; align-items: center; justify-content: center; }
    .empty-icon i { font-size: 2.5rem; color: var(--ts-brand); }
    
    /* ── Dialog Customization ──────────────────────────── */
    ::ng-deep .ts-order-dialog {
      background: var(--ts-card) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 20px !important;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important;
      overflow: hidden;
      width: 90vw !important;
      max-width: 600px !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-header {
      padding: 1.5rem !important;
      background: var(--ts-surface-2) !important;
      border-bottom: 1px solid var(--ts-border) !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-title {
      font-family: 'Outfit', sans-serif !important;
      font-weight: 800 !important;
      font-size: 1.25rem !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-header-icon {
      color: var(--ts-text-muted) !important;
      width: 36px !important;
      height: 36px !important;
      border-radius: 10px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
      background: transparent !important;
      border: none !important;
      cursor: pointer;
    }
    ::ng-deep .ts-order-dialog .p-dialog-header-icon:hover {
      background: var(--ts-surface) !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-content {
      padding: 0 !important;
      background: transparent !important;
      border: none !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-footer {
      padding: 1.25rem 1.5rem !important;
      background: var(--ts-surface-2) !important;
      border-top: 1px solid var(--ts-border) !important;
      display: flex !important;
      justify-content: flex-end !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-footer .p-button {
      padding: 0.6rem 1.2rem !important;
      border-radius: 10px !important;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 700 !important;
      background: var(--ts-surface) !important;
      border: 1px solid var(--ts-border) !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-order-dialog .p-dialog-footer .p-button:hover { border-color: var(--ts-text-muted) !important; }
    
    /* ── Detalle de Ítems dentro del Modal ─────────────── */
    .item-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--ts-border);
    }
    .item-row:last-child { border-bottom: none; }
    
    .item-icon {
      width: 48px; height: 48px; border-radius: 12px; background: rgba(108,99,255,0.1);
      display: flex; align-items: center; justify-content: center;
    }
    .item-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .item-name { font-weight: 700; color: var(--ts-text); font-size: 0.95rem; line-height: 1.3; }
    .item-qty { font-size: 0.8rem; color: var(--ts-text-muted); font-weight: 600; }
    .item-price { font-weight: 800; color: var(--ts-text); font-size: 1rem; text-align: right; }
    
    .modal-summary { background: var(--ts-surface-2); padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .summary-label { font-size: 0.9rem; font-weight: 700; color: var(--ts-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-total { font-size: 1.5rem; font-weight: 900; color: var(--ts-brand); }
    
    /* ── Banner de pago exitoso ─────────────────────────── */
    .payment-success-banner {
      display: flex; align-items: center; gap: 1rem;
      background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.35);
      border-radius: 14px; padding: 1rem 1.25rem; margin-top: 1.5rem;
      animation: slide-in .4s cubic-bezier(.34,1.56,.64,1) both;
    }
    @keyframes slide-in {
      from { transform: translateY(-12px); opacity: 0; }
      to   { transform: translateY(0);     opacity: 1; }
    }
    .payment-success-banner .banner-icon {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: rgba(16,185,129,.25); color: #10B981;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .banner-dismiss {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: #10B981; opacity: .7; padding: 4px; border-radius: 6px;
      transition: opacity .2s;
    }
    .banner-dismiss:hover { opacity: 1; }

    /* ── Paginación ──────────────────────────────────────── */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding-top: 2rem; }
    .page-btn {
      min-width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--ts-border);
      background: var(--ts-card); color: var(--ts-text-muted); font-weight: 700; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-family: 'Outfit', sans-serif;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--ts-brand); color: var(--ts-brand); }
    .page-btn.active { background: var(--ts-brand); border-color: var(--ts-brand); color: #fff; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    @media (max-width: 640px) {
      .orders-wrap {
        padding-bottom: 2rem;
      }
      .orders-header {
        padding: 1.25rem 0;
      }
      .orders-filter-actions {
        flex-wrap: wrap;
        width: 100%;
      }
      ::ng-deep .orders-filter-actions .p-select {
        width: 100% !important;
      }
      .orders-filter-actions .ts-btn-brand {
        min-height: 44px;
        width: 100%;
      }
      .order-list {
        gap: 1rem;
        margin-top: 1rem;
      }
      .order-card {
        border-radius: 14px;
        gap: 1rem;
        padding: 1rem;
      }
      .order-head,
      .order-body {
        align-items: stretch;
      }
      .order-id {
        font-size: 1.1rem;
      }
      .order-total {
        font-size: 1.35rem;
      }
      .order-status,
      .btn-details {
        justify-content: center;
        min-height: 44px;
        width: 100%;
      }
      .payment-success-banner {
        align-items: flex-start;
        padding: 0.9rem;
      }
      .banner-dismiss {
        min-height: 36px;
        min-width: 36px;
      }
      .pagination {
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .page-btn {
        height: 40px;
        min-width: 40px;
      }
      .item-row {
        align-items: flex-start;
        flex-wrap: wrap;
        padding: 1rem;
      }
      .item-icon {
        height: 44px;
        width: 44px;
      }
      .item-info {
        min-width: 0;
      }
      .item-price {
        padding-left: 60px;
        text-align: left;
        width: 100%;
      }
      .modal-summary {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.35rem;
        padding: 1rem;
      }
      ::ng-deep .ts-order-dialog .p-dialog-footer {
        padding: 1rem !important;
      }
      ::ng-deep .ts-order-dialog .p-dialog-footer .p-button {
        justify-content: center !important;
        width: 100% !important;
      }
    }
  `],
  template: `
    <div class="orders-wrap">
      
      <!-- Header -->
      <div class="orders-header">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color: var(--ts-brand);">Historial</p>
              <h1 class="text-3xl font-black" style="color: var(--ts-text);">Mis Pedidos</h1>
            </div>
            
            <div class="orders-filter-actions flex items-center gap-3">
              <!-- Filtro de estado -->
              <p-select
                [options]="store.statusOptions"
                [(ngModel)]="statusFilter"
                (onChange)="onFilterChange()"
                placeholder="Filtrar por estado"
                [showClear]="true"
                styleClass="ts-select"
              ></p-select>
              
              <button class="ts-btn-brand px-3 py-2" style="border-radius: 10px;" (click)="store.load()" [disabled]="store.loading()">
                <i class="pi pi-refresh text-sm" [class.animate-spin]="store.loading()"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        
        <!-- Banner Pago Exitoso -->
        @if (paymentSuccess()) {
          <div class="payment-success-banner">
            <div class="banner-icon"><i class="pi pi-check" aria-hidden="true"></i></div>
            <div>
              <p class="font-bold text-sm" style="color: #10B981;">¡Pago aprobado exitosamente!</p>
              <p class="text-xs" style="color: #10B981; opacity: .8;">Tu pedido ha sido confirmado. Aparece a continuación en tu historial.</p>
            </div>
            <button class="banner-dismiss" (click)="paymentSuccess.set(false)" aria-label="Cerrar">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        }

        <!-- Error -->
        @if (store.error()) {
          <div class="flex items-center gap-3 p-4 rounded-xl mt-6" style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);">
            <i class="pi pi-exclamation-triangle" style="color:#EF4444;"></i>
            <span class="text-sm font-semibold" style="color:#EF4444;">{{ store.error() }}</span>
          </div>
        }

        <!-- Skeletons -->
        @if (store.loading()) {
          <div class="order-list">
            @for (i of [1,2,3]; track i) {
              <div class="order-card" style="padding: 0;">
                <p-skeleton width="100%" height="160px" borderRadius="16px"></p-skeleton>
              </div>
            }
          </div>
        }

        <!-- Lista de Pedidos -->
        @if (!store.loading()) {
          @if (store.orders().length === 0) {
            <div class="empty-state">
              <div class="empty-icon"><i class="pi pi-box"></i></div>
              <h3 class="text-xl font-bold" style="color: var(--ts-text);">Ningún pedido encontrado</h3>
              <p class="text-sm" style="color: var(--ts-text-muted);">
                {{ statusFilter ? 'No tienes pedidos con este estado.' : 'Aún no has realizado ninguna compra en TechStore Pro.' }}
              </p>
              @if (!statusFilter) {
                <a routerLink="/catalogo" class="ts-btn-brand px-6 py-3 mt-2 rounded-xl text-sm font-bold no-underline">
                  Ir al catálogo
                </a>
              }
            </div>
          } @else {
            <div class="order-list">
              @for (order of store.orders(); track order.id) {
                <div class="order-card">
                  
                  <div class="order-head">
                    <div>
                      <h2 class="order-id">Pedido #{{ order.id }}</h2>
                      <p class="order-date">
                        <i class="pi pi-calendar"></i>
                        {{ order.createdAt | date:'mediumDate' }} a las {{ order.createdAt | date:'shortTime' }}
                      </p>
                    </div>
                    
                    <div class="order-status" 
                         [style.background]="getStatusBg(order.status)"
                         [style.color]="getStatusColor(order.status)">
                      <i [class]="getStatusIcon(order.status)"></i>
                      {{ getStatusText(order.status) }}
                    </div>
                  </div>
                  
                  <div class="order-body">
                    <div class="order-info">
                      <span class="order-info-label">Total pagado</span>
                      <span class="order-total">S/ {{ order.total | number:'1.2-2' }}</span>
                      <span class="text-xs font-semibold" style="color: var(--ts-text-muted);">
                        {{ order.items.length }} {{ order.items.length === 1 ? 'artículo' : 'artículos' }}
                      </span>
                    </div>
                    
                    <button class="btn-details" (click)="viewDetails(order)">
                      <i class="pi pi-eye"></i> Ver detalles
                    </button>
                  </div>
                  
                </div>
              }
            </div>

            <!-- Paginación -->
            <div class="pagination">
              <button class="page-btn" [disabled]="store.page() === 0" (click)="goToPage(store.page() - 1)">
                <i class="pi pi-chevron-left text-xs"></i>
              </button>
              @for (p of pages(); track p) {
                <button class="page-btn" [class.active]="p === store.page()" (click)="goToPage(p)">
                  {{ p + 1 }}
                </button>
              }
              <button class="page-btn" [disabled]="store.page() >= totalPages() - 1" (click)="goToPage(store.page() + 1)">
                <i class="pi pi-chevron-right text-xs"></i>
              </button>
            </div>
          }
        }
      </div>
    </div>

    <!-- Modal de Detalles del Pedido -->
    <p-dialog 
      [(visible)]="detailsVisible" 
      [modal]="true" 
      [dismissableMask]="true"
      [closeOnEscape]="true"
      styleClass="ts-order-dialog"
      [draggable]="false"
      [resizable]="false"
      [header]="'Detalles del Pedido #' + (selectedOrder?.id || '')"
    >
      @if (selectedOrder) {
        <div style="max-height: 60vh; overflow-y: auto;">
          @for (item of selectedOrder.items; track item.productId) {
            <div class="item-row">
              <div class="item-icon">
                <i class="pi pi-box" style="font-size: 1.25rem; color: var(--ts-brand);"></i>
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.productName }}</span>
                <span class="item-qty">{{ item.quantity }}x a S/ {{ item.unitPrice | number:'1.2-2' }}</span>
              </div>
              <div class="item-price">
                S/ {{ item.subtotal | number:'1.2-2' }}
              </div>
            </div>
          }
        </div>
        
        <!-- Summary interior del modal -->
        <div class="modal-summary">
          <span class="summary-label">Total del Pedido</span>
          <span class="summary-total">S/ {{ selectedOrder.total | number:'1.2-2' }}</span>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button label="Cerrar" icon="pi pi-times" (click)="detailsVisible = false" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  readonly store = inject(OrdersStore);
  private readonly route = inject(ActivatedRoute);

  statusFilter: OrderStatus | null = null;
  
  detailsVisible = false;
  selectedOrder: Order | null = null;

  /** Muestra el banner de éxito cuando el usuario viene de un pago aprobado */
  readonly paymentSuccess = signal(false);
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const currentStatus = this.store.filters().status;
    if (currentStatus) this.statusFilter = currentStatus;
    
    // Al cargar la vista de pedidos, asegurarse de pedir desde la pag 0
    this.store.load({ page: 0 });

    // Detectar si viene de un pago aprobado (observable, más fiable en SPA)
    this.route.queryParams.subscribe(params => {
      const isSuccess = params['payment_success'] === '1' || params['success'] === 'true';
      
      if (isSuccess) {
        this.paymentSuccess.set(true);
        // Auto-cerrar el banner a los 6 segundos
        if (this.bannerTimer) clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => this.paymentSuccess.set(false), 6000);
      }
    });
  }

  onFilterChange(): void {
    this.store.applyFilters({ status: this.statusFilter || undefined });
  }

  viewDetails(order: Order): void {
    this.selectedOrder = order;
    this.detailsVisible = true;
  }

  // Helpers UI Estado
  getStatusText(status: OrderStatus): string {
    switch(status) {
      case 'PENDING_PAYMENT': return 'Pendiente de pago';
      case 'CONFIRMED': return 'Confirmado';
      case 'DELIVERED': return 'Entregado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  }

  getStatusIcon(status: OrderStatus): string {
    switch(status) {
      case 'PENDING_PAYMENT': return 'pi pi-wallet';
      case 'CONFIRMED': return 'pi pi-check-circle';
      case 'DELIVERED': return 'pi pi-truck';
      case 'CANCELLED': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }

  getStatusBg(status: OrderStatus): string {
    switch(status) {
      case 'PENDING_PAYMENT': return 'rgba(245,158,11,0.15)';
      case 'CONFIRMED': return 'rgba(108,99,255,0.15)';
      case 'DELIVERED': return 'rgba(16,185,129,0.15)';
      case 'CANCELLED': return 'rgba(239,68,68,0.15)';
      default: return 'rgba(255,255,255,0.1)';
    }
  }

  getStatusColor(status: OrderStatus): string {
    switch(status) {
      case 'PENDING_PAYMENT': return '#F59E0B';
      case 'CONFIRMED': return 'var(--ts-brand)';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#FFF';
    }
  }

  // Paginación
  totalPages(): number {
    return Math.ceil(this.store.totalElements() / this.store.size()) || 1;
  }

  pages(): number[] {
    const total = this.totalPages();
    const current = this.store.page();
    const range: number[] = [];
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) {
      range.push(i);
    }
    return range;
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.store.setPage(page, this.store.size());
  }
}
