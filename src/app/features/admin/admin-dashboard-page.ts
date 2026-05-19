import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { Category } from '../../core/models/category.model';
import { Product, ProductFilters, ProductRequest, ProductStockStatus } from '../../core/models/product.model';
import { Order, OrderFilters, OrderStatus } from '../../core/models/order.model';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ProductApiService } from '../../core/services/product-api.service';
import { OrderApiService } from '../../core/services/order-api.service';
import { SelectOption } from '../../shared/models/select-option.model';
import { displayImageUrl } from '../../core/utils/image-url.util';

interface LazyPageEvent {
  first?: number | null;
  rows?: number | null;
}

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DecimalPipe, DatePipe, NgClass, FormsModule, ButtonModule, InputNumberModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule, DialogModule, TooltipModule],
  styles: [`
    .admin-page { min-height: 100vh; background: var(--ts-surface); padding-bottom: 4rem; }
    
    .table-card {
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 2rem;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .table-header-title {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--ts-border);
      background: rgba(255,255,255,0.02);
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.1rem;
      color: var(--ts-text);
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      align-items: center;
    }

    .filters-bar {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 0.75rem;
      padding: 0.95rem 1rem 1rem;
      border-bottom: 1px solid var(--ts-border);
      background: rgba(255,255,255,0.015);
      align-items: end;
    }

    .filter-actions {
      display: flex;
      align-items: end;
      gap: 0.5rem;
      justify-content: flex-start;
      grid-column: span 3;
      min-width: 0;
    }

    .filter-action-secondary {
      align-items: center;
      border-radius: 8px;
      display: inline-flex;
      font-size: 0.82rem;
      font-weight: 800;
      gap: 0.4rem;
      height: 36px;
      justify-content: center;
      line-height: 1;
      padding: 0 0.85rem;
      white-space: nowrap;
    }

    .filter-action-secondary {
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--ts-border);
      color: var(--ts-text-muted);
    }

    .filter-label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      color: var(--ts-text-muted);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      grid-column: span 2;
      min-width: 0;
    }

    .filter-label.filter-search {
      grid-column: span 3;
    }

    .filter-label.filter-small {
      grid-column: span 2;
    }

    .filter-label.filter-secondary { opacity: 0.9; }

    .native-date {
      background: var(--ts-surface-2);
      border: 1px solid var(--ts-border);
      border-radius: 8px;
      color: var(--ts-text);
      padding: 0 0.68rem;
      font: inherit;
      height: 36px;
      line-height: 36px;
      width: 100%;
    }

    .desktop-data { display: block; }
    .mobile-data { display: none; }

    .section-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      min-height: 13rem;
      padding: 2rem 1.25rem;
      color: var(--ts-text-muted);
      text-align: center;
      border-top: 1px solid var(--ts-border);
    }

    .section-state i {
      color: var(--ts-text-dim);
      font-size: 2rem;
    }

    .section-state strong {
      color: var(--ts-text);
      font-size: 0.95rem;
    }

    .mobile-list {
      display: grid;
      gap: 0.85rem;
      padding: 1rem;
      border-top: 1px solid var(--ts-border);
    }

    .mobile-card {
      background: var(--ts-surface-2);
      border: 1px solid var(--ts-border);
      border-radius: 8px;
      padding: 1rem;
    }

    .mobile-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }

    .mobile-card-title {
      color: var(--ts-text);
      font-weight: 800;
      line-height: 1.25;
    }

    .mobile-card-subtitle {
      color: var(--ts-text-dim);
      font-size: 0.78rem;
      margin-top: 0.2rem;
      overflow-wrap: anywhere;
    }

    .mobile-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
      margin-top: 0.75rem;
    }

    .mobile-meta span {
      color: var(--ts-text-muted);
      display: block;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .mobile-meta strong {
      color: var(--ts-text);
      display: block;
      font-size: 0.9rem;
      margin-top: 0.15rem;
    }

    .mobile-actions {
      border-top: 1px solid var(--ts-border);
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: flex-end;
      margin-top: 0.9rem;
      padding-top: 0.85rem;
    }

    .mobile-pager {
      align-items: center;
      border-top: 1px solid var(--ts-border);
      display: flex;
      gap: 0.75rem;
      justify-content: space-between;
      padding: 0 1rem 1rem;
    }

    .status-badge {
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .status-badge-pending {
      background: rgba(245, 158, 11, 0.16);
      border-color: rgba(245, 158, 11, 0.35);
      color: #FBBF24;
    }

    .status-badge-confirmed {
      background: rgba(108, 99, 255, 0.16);
      border-color: rgba(108, 99, 255, 0.35);
      color: var(--ts-brand-light);
    }

    /* PrimeNG Table overrides para dark mode premium */
    ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background: var(--ts-surface-2) !important;
      color: var(--ts-text-muted) !important;
      border-bottom: 1px solid var(--ts-border) !important;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 1rem 1.5rem !important;
    }
    ::ng-deep .p-datatable .p-datatable-tbody > tr {
      background: transparent !important;
      color: var(--ts-text) !important;
      transition: background 0.2s;
    }
    ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background: rgba(255,255,255,0.02) !important;
    }
    ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      border-bottom: 1px solid var(--ts-border) !important;
      padding: 1rem 1.5rem !important;
    }
    ::ng-deep .p-datatable .p-paginator {
      background: transparent !important;
      border-top: 1px solid var(--ts-border) !important;
      padding: 1rem !important;
    }
    
    /* Dialog overrides */
    ::ng-deep .p-dialog { border-radius: 16px !important; overflow: hidden; border: 1px solid var(--ts-border); }
    ::ng-deep .p-dialog .p-dialog-header { background: var(--ts-surface-2) !important; color: var(--ts-text) !important; border-bottom: 1px solid var(--ts-border) !important; }
    ::ng-deep .p-dialog .p-dialog-content { background: var(--ts-card) !important; padding: 1.5rem !important; }
    ::ng-deep .p-dialog .p-dialog-footer { background: var(--ts-surface-2) !important; border-top: 1px solid var(--ts-border) !important; }

    /* Forms inside dialog */
    .form-label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; color: var(--ts-text-muted); margin-bottom: 1rem; }
    ::ng-deep .form-label .p-inputtext, 
    ::ng-deep .form-label .p-inputnumber-input, 
    ::ng-deep .form-label .p-textarea {
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      color: var(--ts-text) !important;
      border-radius: 8px !important;
      padding: 0.6rem 0.8rem;
      width: 100%;
    }
    ::ng-deep .form-label .p-inputtext:focus,
    ::ng-deep .form-label .p-textarea:focus { border-color: var(--ts-brand) !important; }
    ::ng-deep .filters-bar .p-inputtext,
    ::ng-deep .filters-bar .p-inputnumber-input,
    ::ng-deep .filters-bar .p-select {
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      color: var(--ts-text) !important;
      border-radius: 8px !important;
      width: 100% !important;
      box-shadow: none !important;
    }
    ::ng-deep .filters-bar .p-inputtext,
    ::ng-deep .filters-bar .p-inputnumber-input,
    ::ng-deep .filters-bar .p-select,
    .native-date {
      box-sizing: border-box;
      height: 36px !important;
      min-height: 36px !important;
    }
    ::ng-deep .filters-bar .p-inputtext,
    ::ng-deep .filters-bar .p-inputnumber-input {
      font-size: 0.82rem !important;
      font-weight: 700 !important;
      line-height: 34px !important;
      padding: 0 0.68rem !important;
    }
    ::ng-deep .filters-bar .p-select {
      align-items: center;
      display: flex;
    }
    ::ng-deep .filters-bar .p-select-label {
      align-items: center;
      display: flex;
      flex: 1;
      font-size: 0.82rem !important;
      font-weight: 700 !important;
      height: 34px;
      line-height: 34px;
      min-height: 34px;
      padding: 0 0.68rem !important;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ::ng-deep .filters-bar .p-select-dropdown {
      align-items: center;
      display: flex;
      height: 34px;
      justify-content: center;
      width: 2rem;
    }
    ::ng-deep .filters-bar .p-select-dropdown-icon {
      font-size: 0.72rem;
    }
    ::ng-deep .filters-bar .p-inputtext::placeholder,
    ::ng-deep .filters-bar .p-inputnumber-input::placeholder {
      color: var(--ts-text-dim);
      opacity: 1;
    }
    ::ng-deep .filters-bar .p-inputnumber,
    ::ng-deep .filters-bar .p-select {
      width: 100% !important;
    }
    ::ng-deep .filter-priority .p-inputtext,
    ::ng-deep .filter-priority .p-select {
      border-color: rgba(108, 99, 255, 0.38) !important;
      background: rgba(108, 99, 255, 0.055) !important;
    }
    @media (max-width: 1180px) {
      .filters-bar {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
      .filter-label,
      .filter-actions {
        grid-column: span 2;
      }
      .filter-label.filter-search {
        grid-column: span 3;
      }
      .filter-label.filter-small {
        grid-column: span 2;
      }
    }

    @media (max-width: 767px) {
      .admin-page { padding-bottom: 2rem; }
      .table-header-title {
        align-items: flex-start;
        flex-direction: column;
        padding: 1rem;
      }
      .filters-bar {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        padding: 0.9rem;
      }
      .filter-label,
      .filter-label.filter-search,
      .filter-label.filter-small {
        grid-column: span 2;
      }
      .filter-actions {
        grid-column: span 2;
        justify-content: stretch;
      }
      .filter-action-secondary {
        flex: 1;
        height: 44px;
      }
      .desktop-data { display: none; }
      .mobile-data { display: block; }
      .mobile-meta { grid-template-columns: 1fr; }
      .mobile-pager { display: flex; }
    }

    @media (max-width: 420px) {
      .filters-bar { grid-template-columns: 1fr; }
      .filter-label,
      .filter-label.filter-search,
      .filter-label.filter-small,
      .filter-actions {
        grid-column: span 1;
      }
    }
  `],
  template: `
    <div class="admin-page">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        <!-- HEADER -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p class="text-sm font-bold uppercase tracking-widest mb-1" style="color: var(--ts-brand);">Administracion</p>
            <h1 class="text-3xl font-black" style="color: var(--ts-text);">Gestion de Inventario</h1>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" [loading]="loading()" (onClick)="reload()" ariaLabel="Actualizar datos del administrador" title="Actualizar datos" pTooltip="Actualizar datos" />
            <p-button label="Nueva Categoria" icon="pi pi-folder-plus" severity="secondary" (onClick)="openCategoryDialog()" ariaLabel="Crear nueva categoria" title="Crear nueva categoria" />
            <p-button label="Nuevo Producto" icon="pi pi-box" (onClick)="openProductDialog()" ariaLabel="Crear nuevo producto" title="Crear nuevo producto" />
          </div>
        </div>

        <!-- TABS DE NAVEGACION -->
        <div class="flex gap-6 border-b mb-6" style="border-color: var(--ts-border);">
          <button class="pb-3 text-sm font-bold tracking-wide uppercase transition-colors" 
                  [class]="activeTab() === 'productos' ? 'text-[var(--ts-brand)] border-b-2 border-[var(--ts-brand)]' : 'text-[var(--ts-text-muted)] hover:text-[var(--ts-text)]'" 
                  [attr.aria-pressed]="activeTab() === 'productos'"
                  (click)="activeTab.set('productos')">
            Productos
          </button>
          <button class="pb-3 text-sm font-bold tracking-wide uppercase transition-colors" 
                  [class]="activeTab() === 'categorias' ? 'text-[var(--ts-brand)] border-b-2 border-[var(--ts-brand)]' : 'text-[var(--ts-text-muted)] hover:text-[var(--ts-text)]'" 
                  [attr.aria-pressed]="activeTab() === 'categorias'"
                  (click)="activeTab.set('categorias')">
            Categorias
          </button>
          <button class="pb-3 text-sm font-bold tracking-wide uppercase transition-colors" 
                  [class]="activeTab() === 'pedidos' ? 'text-[var(--ts-brand)] border-b-2 border-[var(--ts-brand)]' : 'text-[var(--ts-text-muted)] hover:text-[var(--ts-text)]'" 
                  [attr.aria-pressed]="activeTab() === 'pedidos'"
                  (click)="activeTab.set('pedidos')">
            Pedidos
          </button>
        </div>

        <!-- TABLA PRODUCTOS -->
        @if (activeTab() === 'productos') {
          <div class="table-card">
            <div class="table-header-title">
              <span><i class="pi pi-box mr-2"></i> Lista de Productos</span>
              <span class="text-xs px-3 py-1 rounded-full" style="background: rgba(255,255,255,0.05); color: var(--ts-text-muted);">{{ productsTotalElements() }} registrados</span>
            </div>
            <div class="filters-bar">
              <label class="filter-label filter-search filter-priority">
                Buscar
                <input pInputText type="search" [(ngModel)]="productFilters.q" (ngModelChange)="scheduleProductFilters()" placeholder="Nombre o descripcion" aria-label="Buscar productos por nombre o descripcion" />
              </label>
              <label class="filter-label filter-priority">
                Categoria
                <p-select [options]="productCategoryOptions()" optionLabel="label" optionValue="value" [(ngModel)]="productFilters.category" (ngModelChange)="applyProductFilters()" [showClear]="true" placeholder="Todas" appendTo="body" ariaLabel="Filtrar productos por categoria" />
              </label>
              <label class="filter-label filter-priority">
                Stock
                <p-select [options]="stockOptions" optionLabel="label" optionValue="value" [(ngModel)]="productFilters.stockStatus" (ngModelChange)="applyProductFilters()" [showClear]="true" placeholder="Cualquier stock" appendTo="body" ariaLabel="Filtrar productos por stock" />
              </label>
              <label class="filter-label filter-priority">
                Activo
                <p-select [options]="activeOptions" optionLabel="label" optionValue="value" [(ngModel)]="productFilters.active" (ngModelChange)="applyProductFilters()" [showClear]="true" placeholder="Todos" appendTo="body" ariaLabel="Filtrar productos por estado activo" />
              </label>
              <div class="filter-actions">
                <button type="button" class="filter-action-secondary" (click)="clearProductFilters()" aria-label="Limpiar filtros de productos" title="Limpiar filtros de productos">
                  <i class="pi pi-times" aria-hidden="true"></i>
                  Limpiar
                </button>
              </div>
              <label class="filter-label filter-secondary">
                Precio min.
                <p-inputnumber [(ngModel)]="productFilters.minPrice" (ngModelChange)="scheduleProductFilters()" mode="decimal" [min]="0" [minFractionDigits]="2" [maxFractionDigits]="2" placeholder="S/ 0.00" />
              </label>
              <label class="filter-label filter-secondary">
                Precio max.
                <p-inputnumber [(ngModel)]="productFilters.maxPrice" (ngModelChange)="scheduleProductFilters()" mode="decimal" [min]="0" [minFractionDigits]="2" [maxFractionDigits]="2" placeholder="Sin limite" />
              </label>
              <label class="filter-label filter-small filter-secondary">
                Desde
                <input class="native-date" type="date" [(ngModel)]="productFilters.createdFrom" (ngModelChange)="applyProductFilters()" />
              </label>
              <label class="filter-label filter-small filter-secondary">
                Hasta
                <input class="native-date" type="date" [(ngModel)]="productFilters.createdTo" (ngModelChange)="applyProductFilters()" />
              </label>
              <label class="filter-label filter-secondary">
                Orden
                <p-select [options]="productSortOptions" optionLabel="label" optionValue="value" [(ngModel)]="productFilters.sort" (ngModelChange)="applyProductFilters()" appendTo="body" ariaLabel="Ordenar productos" />
              </label>
            </div>
            @if (productsError()) {
              <div class="section-state" role="alert" aria-live="polite">
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                <strong>No se pudieron cargar los productos.</strong>
                <span>Revisa la conexion o intenta nuevamente.</span>
                <p-button label="Reintentar" icon="pi pi-refresh" severity="secondary" size="small" (onClick)="retryProducts()" ariaLabel="Reintentar carga de productos" title="Reintentar carga de productos" />
              </div>
            } @else {
            <div class="mobile-data">
              @if (productsLoading()) {
                <div class="section-state" aria-live="polite">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  <strong>Cargando productos...</strong>
                  <span>Estamos actualizando el inventario.</span>
                </div>
              } @else if (products().length === 0) {
                <div class="section-state" aria-live="polite">
                  <i class="pi pi-inbox" aria-hidden="true"></i>
                  <strong>No hay productos para mostrar.</strong>
                  <span>Ajusta los filtros o crea un producto nuevo.</span>
                </div>
              } @else {
                <div class="mobile-list" aria-label="Productos en formato de tarjetas">
                  @for (row of products(); track row.id) {
                    <article class="mobile-card">
                      <div class="mobile-card-header">
                        <div class="flex min-w-0 gap-3">
                          <img class="h-14 w-14 shrink-0 rounded-lg object-cover" [src]="imageSrc(row.imageUrl) || fallbackImage" [alt]="row.name" style="background: rgba(255,255,255,0.05);" />
                          <div class="min-w-0">
                            <h3 class="mobile-card-title" [class.opacity-50]="!row.active">{{ row.name }}</h3>
                            <p class="mobile-card-subtitle">{{ row.description }}</p>
                          </div>
                        </div>
                        <span class="ts-badge" [class.ts-badge-success]="row.active" [class.ts-badge-danger]="!row.active">
                          {{ row.active ? 'Activo' : 'Inactivo' }}
                        </span>
                      </div>
                      <div class="mobile-meta">
                        <div><span>Categoria</span><strong>{{ row.category }}</strong></div>
                        <div><span>Precio</span><strong>S/ {{ row.price | number: '1.2-2' }}</strong></div>
                        <div><span>Stock</span><strong [class.text-red-400]="row.stock <= 0" [class.text-emerald-400]="row.stock > 0">{{ row.stock }}</strong></div>
                      </div>
                      <div class="mobile-actions">
                        <p-button label="Editar" icon="pi pi-pencil" severity="info" size="small" [text]="true" (onClick)="openProductDialog(row)" [ariaLabel]="'Editar producto ' + row.name" [title]="'Editar producto ' + row.name" />
                        <p-button [label]="row.active ? 'Desactivar' : 'Activar'" [icon]="row.active ? 'pi pi-eye-slash' : 'pi pi-eye'" [severity]="row.active ? 'danger' : 'success'" size="small" [text]="true" (onClick)="toggleProductActive(row)" [ariaLabel]="(row.active ? 'Desactivar producto ' : 'Activar producto ') + row.name" [title]="(row.active ? 'Desactivar producto ' : 'Activar producto ') + row.name" />
                      </div>
                    </article>
                  }
                </div>
                <div class="mobile-pager">
                  <p-button label="Anterior" icon="pi pi-chevron-left" severity="secondary" size="small" [text]="true" [disabled]="productPage() === 0 || productsLoading()" (onClick)="previousProductsPage()" ariaLabel="Pagina anterior de productos" title="Pagina anterior de productos" />
                  <span class="text-xs font-bold text-[var(--ts-text-muted)]">Pagina {{ productPage() + 1 }} de {{ productTotalPages() }}</span>
                  <p-button label="Siguiente" icon="pi pi-chevron-right" iconPos="right" severity="secondary" size="small" [text]="true" [disabled]="productPage() >= productTotalPages() - 1 || productsLoading()" (onClick)="nextProductsPage()" ariaLabel="Pagina siguiente de productos" title="Pagina siguiente de productos" />
                </div>
              }
            </div>
            <p-table
              class="desktop-data"
              [value]="products()"
              [loading]="productsLoading()"
              dataKey="id"
              [paginator]="true"
              [lazy]="true"
              [rows]="productPageSize()"
              [first]="productPage() * productPageSize()"
              [totalRecords]="productsTotalElements()"
              (onLazyLoad)="onProductsLazyLoad($event)"
              responsiveLayout="scroll"
            >
              <ng-template #header>
                <tr>
                  <th class="w-24">Imagen</th>
                  <th>Informacion del Producto</th>
                  <th>Categoria</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th class="w-28 text-center">Accion</th>
                </tr>
              </ng-template>
              <ng-template #body let-row>
                <tr>
                  <td>
                    <img class="h-14 w-14 rounded-lg object-cover" [src]="imageSrc(row.imageUrl) || fallbackImage" [alt]="row.name" style="background: rgba(255,255,255,0.05);" />
                  </td>
                  <td>
                    <div class="font-bold text-sm mb-1" [class.opacity-50]="!row.active">{{ row.name }}</div>
                    <div class="max-w-xs truncate text-xs" style="color: var(--ts-text-dim);">{{ row.description }}</div>
                  </td>
                  <td>
                    <span class="text-xs font-bold uppercase tracking-wider" style="color: var(--ts-brand-light);">{{ row.category }}</span>
                  </td>
                  <td class="font-bold">S/ {{ row.price | number: '1.2-2' }}</td>
                  <td>
                    @if (row.stock > 0) {
                      <span class="font-bold" style="color: #10B981;">{{ row.stock }}</span>
                    } @else {
                      <span class="font-bold" style="color: #EF4444;">0</span>
                    }
                  </td>
                  <td>
                    <span class="ts-badge" [class.ts-badge-success]="row.active" [class.ts-badge-danger]="!row.active">
                      {{ row.active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-center gap-1">
                      <p-button icon="pi pi-pencil" severity="info" [rounded]="true" [text]="true" (onClick)="openProductDialog(row)" [ariaLabel]="'Editar producto ' + row.name" [title]="'Editar producto ' + row.name" />
                      <p-button [icon]="row.active ? 'pi pi-eye-slash' : 'pi pi-eye'" [severity]="row.active ? 'danger' : 'success'" [rounded]="true" [text]="true" (onClick)="toggleProductActive(row)" [ariaLabel]="(row.active ? 'Desactivar producto ' : 'Activar producto ') + row.name" [title]="(row.active ? 'Desactivar producto ' : 'Activar producto ') + row.name" />
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="7" class="py-12 text-center" style="color: var(--ts-text-muted);">
                    <i class="pi pi-inbox text-3xl mb-3 opacity-50 block"></i>
                    No hay productos registrados en el inventario.
                  </td>
                </tr>
              </ng-template>
            </p-table>
            }
          </div>
        }

        <!-- TABLA CATEGORIAS -->
        @if (activeTab() === 'categorias') {
          <div class="table-card">
            <div class="table-header-title">
              <span><i class="pi pi-tags mr-2"></i> Categorias</span>
              <span class="text-xs px-3 py-1 rounded-full" style="background: rgba(255,255,255,0.05); color: var(--ts-text-muted);">{{ categories().length }} registradas</span>
            </div>
            @if (categoriesError()) {
              <div class="section-state" role="alert" aria-live="polite">
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                <strong>No se pudieron cargar las categorias.</strong>
                <span>Revisa la conexion o intenta nuevamente.</span>
                <p-button label="Reintentar" icon="pi pi-refresh" severity="secondary" size="small" (onClick)="reload()" ariaLabel="Reintentar carga de categorias" title="Reintentar carga de categorias" />
              </div>
            } @else {
            <div class="mobile-data">
              @if (loading()) {
                <div class="section-state" aria-live="polite">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  <strong>Cargando categorias...</strong>
                  <span>Estamos actualizando el catalogo.</span>
                </div>
              } @else if (categories().length === 0) {
                <div class="section-state" aria-live="polite">
                  <i class="pi pi-inbox" aria-hidden="true"></i>
                  <strong>No hay categorias registradas.</strong>
                  <span>Crea una categoria para organizar el inventario.</span>
                </div>
              } @else {
                <div class="mobile-list" aria-label="Categorias en formato de tarjetas">
                  @for (row of categories(); track row.id) {
                    <article class="mobile-card">
                      <div class="mobile-card-header">
                        <div>
                          <h3 class="mobile-card-title" [class.opacity-50]="!row.active">{{ row.name }}</h3>
                          <p class="mobile-card-subtitle">Categoria de productos</p>
                        </div>
                        <span class="ts-badge" [class.ts-badge-success]="row.active" [class.ts-badge-danger]="!row.active">
                          {{ row.active ? 'Activa' : 'Inactiva' }}
                        </span>
                      </div>
                      <div class="mobile-actions">
                        <p-button label="Editar" icon="pi pi-pencil" severity="info" size="small" [text]="true" (onClick)="openCategoryDialog(row)" [ariaLabel]="'Editar categoria ' + row.name" [title]="'Editar categoria ' + row.name" />
                        <p-button [label]="row.active ? 'Desactivar' : 'Activar'" [icon]="row.active ? 'pi pi-eye-slash' : 'pi pi-eye'" [severity]="row.active ? 'danger' : 'success'" size="small" [text]="true" (onClick)="toggleCategoryActive(row)" [ariaLabel]="(row.active ? 'Desactivar categoria ' : 'Activar categoria ') + row.name" [title]="(row.active ? 'Desactivar categoria ' : 'Activar categoria ') + row.name" />
                      </div>
                    </article>
                  }
                </div>
              }
            </div>
            <p-table class="desktop-data" [value]="categories()" [loading]="loading()" dataKey="id" [paginator]="true" [rows]="5" responsiveLayout="scroll">
              <ng-template #header>
                <tr>
                  <th>Nombre de Categoria</th>
                  <th>Estado</th>
                  <th class="w-28 text-center">Accion</th>
                </tr>
              </ng-template>
              <ng-template #body let-row>
                <tr>
                  <td class="font-bold" [class.opacity-50]="!row.active">{{ row.name }}</td>
                  <td>
                    <span class="ts-badge" [class.ts-badge-success]="row.active" [class.ts-badge-danger]="!row.active">
                      {{ row.active ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-center gap-1">
                      <p-button icon="pi pi-pencil" severity="info" [rounded]="true" [text]="true" (onClick)="openCategoryDialog(row)" [ariaLabel]="'Editar categoria ' + row.name" [title]="'Editar categoria ' + row.name" />
                      <p-button [icon]="row.active ? 'pi pi-eye-slash' : 'pi pi-eye'" [severity]="row.active ? 'danger' : 'success'" [rounded]="true" [text]="true" (onClick)="toggleCategoryActive(row)" [ariaLabel]="(row.active ? 'Desactivar categoria ' : 'Activar categoria ') + row.name" [title]="(row.active ? 'Desactivar categoria ' : 'Activar categoria ') + row.name" />
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="3" class="py-8 text-center" style="color: var(--ts-text-muted);">No hay categorias registradas.</td>
                </tr>
              </ng-template>
            </p-table>
            }
          </div>
        }

        <!-- TABLA PEDIDOS -->
        @if (activeTab() === 'pedidos') {
          <div class="table-card">
            <div class="table-header-title">
              <span><i class="pi pi-shopping-cart mr-2"></i> Pedidos de Clientes</span>
              <span class="text-xs px-3 py-1 rounded-full" style="background: rgba(255,255,255,0.05); color: var(--ts-text-muted);">{{ ordersTotalElements() }} pedidos</span>
            </div>
            <div class="filters-bar">
              <label class="filter-label filter-priority">
                Estado
                <p-select [options]="orderStatusOptions" optionLabel="label" optionValue="value" [(ngModel)]="orderFilters.status" (ngModelChange)="applyOrderFilters()" [showClear]="true" placeholder="Todos" appendTo="body" ariaLabel="Filtrar pedidos por estado" />
              </label>
              <label class="filter-label filter-search filter-priority">
                Usuario
                <input pInputText type="search" [(ngModel)]="orderFilters.userName" (ngModelChange)="scheduleOrderFilters()" placeholder="Nombre cliente" aria-label="Filtrar pedidos por nombre de cliente" />
              </label>
              <label class="filter-label filter-priority">
                Email
                <input pInputText type="search" [(ngModel)]="orderFilters.userEmail" (ngModelChange)="scheduleOrderFilters()" placeholder="cliente@email.com" aria-label="Filtrar pedidos por email de cliente" />
              </label>
              <label class="filter-label filter-priority">
                Producto
                <input pInputText type="search" [(ngModel)]="orderFilters.productName" (ngModelChange)="scheduleOrderFilters()" placeholder="Producto" aria-label="Filtrar pedidos por producto" />
              </label>
              <div class="filter-actions">
                <button type="button" class="filter-action-secondary" (click)="clearOrderFilters()" aria-label="Limpiar filtros de pedidos" title="Limpiar filtros de pedidos">
                  <i class="pi pi-times" aria-hidden="true"></i>
                  Limpiar
                </button>
              </div>
              <label class="filter-label filter-small filter-secondary">
                Desde
                <input class="native-date" type="date" [(ngModel)]="orderFilters.from" (ngModelChange)="applyOrderFilters()" />
              </label>
              <label class="filter-label filter-small filter-secondary">
                Hasta
                <input class="native-date" type="date" [(ngModel)]="orderFilters.to" (ngModelChange)="applyOrderFilters()" />
              </label>
              <label class="filter-label filter-secondary">
                Total min.
                <p-inputnumber [(ngModel)]="orderFilters.minTotal" (ngModelChange)="scheduleOrderFilters()" mode="decimal" [min]="0" [minFractionDigits]="2" [maxFractionDigits]="2" placeholder="S/ 0.00" />
              </label>
              <label class="filter-label filter-secondary">
                Total max.
                <p-inputnumber [(ngModel)]="orderFilters.maxTotal" (ngModelChange)="scheduleOrderFilters()" mode="decimal" [min]="0" [minFractionDigits]="2" [maxFractionDigits]="2" placeholder="Sin limite" />
              </label>
              <label class="filter-label filter-secondary">
                Orden
                <p-select [options]="orderSortOptions" optionLabel="label" optionValue="value" [(ngModel)]="orderFilters.sort" (ngModelChange)="applyOrderFilters()" appendTo="body" ariaLabel="Ordenar pedidos" />
              </label>
            </div>
            @if (ordersError()) {
              <div class="section-state" role="alert" aria-live="polite">
                <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
                <strong>No se pudieron cargar los pedidos.</strong>
                <span>Revisa la conexion o intenta nuevamente.</span>
                <p-button label="Reintentar" icon="pi pi-refresh" severity="secondary" size="small" (onClick)="retryOrders()" ariaLabel="Reintentar carga de pedidos" title="Reintentar carga de pedidos" />
              </div>
            } @else {
            <div class="mobile-data">
              @if (ordersLoading()) {
                <div class="section-state" aria-live="polite">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  <strong>Cargando pedidos...</strong>
                  <span>Estamos actualizando las ordenes.</span>
                </div>
              } @else if (orders().length === 0) {
                <div class="section-state" aria-live="polite">
                  <i class="pi pi-shopping-bag" aria-hidden="true"></i>
                  <strong>No hay pedidos para mostrar.</strong>
                  <span>Ajusta los filtros o espera nuevas compras.</span>
                </div>
              } @else {
                <div class="mobile-list" aria-label="Pedidos en formato de tarjetas">
                  @for (row of orders(); track row.id) {
                    <article class="mobile-card">
                      <div class="mobile-card-header">
                        <div>
                          <h3 class="mobile-card-title">Pedido #{{ row.id | number:'3.0-0' }}</h3>
                          <p class="mobile-card-subtitle">{{ row.user.name }} · {{ row.user.email }}</p>
                        </div>
                        <span class="ts-badge status-badge" [ngClass]="orderStatusClass(row.status)">
                          {{ orderStatusLabel(row.status) }}
                        </span>
                      </div>
                      <div class="mobile-meta">
                        <div><span>Fecha</span><strong>{{ row.createdAt | date:'short' }}</strong></div>
                        <div><span>Total</span><strong class="text-[var(--ts-brand-light)]">S/ {{ row.total | number: '1.2-2' }}</strong></div>
                      </div>
                      @if (row.status === 'PENDING_PAYMENT') {
                        <p class="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs font-bold text-amber-200">
                          Pendiente de pago: aun no se puede entregar ni cancelar desde este panel.
                        </p>
                      }
                      <div class="mobile-actions">
                        <p-button label="Ver" icon="pi pi-eye" severity="info" size="small" [text]="true" (onClick)="openOrderDetails(row)" [ariaLabel]="'Ver detalles del pedido ' + row.id" [title]="'Ver detalles del pedido ' + row.id" />
                        <p-button label="Entregar" icon="pi pi-check" severity="success" size="small" [text]="true" [disabled]="row.status !== 'CONFIRMED'" (onClick)="updateOrderStatus(row.id, 'DELIVERED')" [ariaLabel]="'Marcar pedido ' + row.id + ' como entregado'" [title]="'Marcar pedido ' + row.id + ' como entregado'" />
                        <p-button label="Cancelar" icon="pi pi-times" severity="danger" size="small" [text]="true" [disabled]="row.status !== 'CONFIRMED'" (onClick)="updateOrderStatus(row.id, 'CANCELLED')" [ariaLabel]="'Cancelar pedido ' + row.id" [title]="'Cancelar pedido ' + row.id" />
                      </div>
                    </article>
                  }
                </div>
                <div class="mobile-pager">
                  <p-button label="Anterior" icon="pi pi-chevron-left" severity="secondary" size="small" [text]="true" [disabled]="orderPage() === 0 || ordersLoading()" (onClick)="previousOrdersPage()" ariaLabel="Pagina anterior de pedidos" title="Pagina anterior de pedidos" />
                  <span class="text-xs font-bold text-[var(--ts-text-muted)]">Pagina {{ orderPage() + 1 }} de {{ orderTotalPages() }}</span>
                  <p-button label="Siguiente" icon="pi pi-chevron-right" iconPos="right" severity="secondary" size="small" [text]="true" [disabled]="orderPage() >= orderTotalPages() - 1 || ordersLoading()" (onClick)="nextOrdersPage()" ariaLabel="Pagina siguiente de pedidos" title="Pagina siguiente de pedidos" />
                </div>
              }
            </div>
            <p-table
              class="desktop-data"
              [value]="orders()"
              [loading]="ordersLoading()"
              dataKey="id"
              [paginator]="true"
              [lazy]="true"
              [rows]="orderPageSize()"
              [first]="orderPage() * orderPageSize()"
              [totalRecords]="ordersTotalElements()"
              (onLazyLoad)="onOrdersLazyLoad($event)"
              responsiveLayout="scroll"
            >
              <ng-template #header>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th class="w-32 text-center">Accion</th>
                </tr>
              </ng-template>
              <ng-template #body let-row>
                <tr>
                  <td class="font-bold text-[var(--ts-text-muted)]">#{{ row.id | number:'3.0-0' }}</td>
                  <td>
                    <div class="font-bold text-sm mb-1">{{ row.user.name }}</div>
                    <div class="text-xs" style="color: var(--ts-text-dim);">{{ row.user.email }}</div>
                  </td>
                  <td>{{ row.createdAt | date:'short' }}</td>
                  <td class="font-bold text-[var(--ts-brand-light)]">S/ {{ row.total | number: '1.2-2' }}</td>
                  <td>
                    <span class="ts-badge status-badge" [ngClass]="orderStatusClass(row.status)">
                      {{ orderStatusLabel(row.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="flex justify-center gap-1">
                      <p-button icon="pi pi-eye" severity="info" [rounded]="true" [text]="true" (onClick)="openOrderDetails(row)" [ariaLabel]="'Ver detalles del pedido ' + row.id" [title]="'Ver detalles del pedido ' + row.id" />
                      <p-button icon="pi pi-check" severity="success" [rounded]="true" [text]="true" [disabled]="row.status !== 'CONFIRMED'" (onClick)="updateOrderStatus(row.id, 'DELIVERED')" [ariaLabel]="'Marcar pedido ' + row.id + ' como entregado'" [title]="'Marcar pedido ' + row.id + ' como entregado'" />
                      <p-button icon="pi pi-times" severity="danger" [rounded]="true" [text]="true" [disabled]="row.status !== 'CONFIRMED'" (onClick)="updateOrderStatus(row.id, 'CANCELLED')" [ariaLabel]="'Cancelar pedido ' + row.id" [title]="'Cancelar pedido ' + row.id" />
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="6" class="py-12 text-center" style="color: var(--ts-text-muted);">
                    <i class="pi pi-shopping-bag text-3xl mb-3 opacity-50 block"></i>
                    No hay pedidos registrados.
                  </td>
                </tr>
              </ng-template>
            </p-table>
            }
          </div>
        }

      </div>
    </div>

    <!-- MODAL PRODUCTO -->
    <p-dialog
      [header]="editProductId() ? 'Editar Producto' : 'Nuevo Producto'"
      [modal]="true"
      [(visible)]="showProductDialog"
      [style]="{ width: '30rem' }"
      [breakpoints]="{ '640px': '92vw' }"
      [draggable]="false"
      [dismissableMask]="!saving()"
      [closeOnEscape]="!saving()"
      [closable]="!saving()"
    >
      <form (ngSubmit)="saveProduct()">
        <div class="mt-2">
          <label class="form-label">
            Nombre del producto
            <input pInputText name="productName" [(ngModel)]="product.name" required maxlength="120" placeholder="Ej. MacBook Pro M3" />
          </label>
          <label class="form-label">
            Categoria
            <p-select name="productCategory" [options]="categoryOptions()" optionLabel="label" optionValue="value" placeholder="Selecciona..." [(ngModel)]="product.categoryId" [style]="{'width':'100%'}" appendTo="body" />
          </label>
          <label class="form-label">
            URL de imagen (Opcional)
            <input pInputText name="imageUrl" type="url" [(ngModel)]="product.imageUrl" maxlength="1000" placeholder="https://..." />
          </label>
          <div class="form-label">
            <span>Subir imagen</span>
            <div class="flex flex-col gap-2 rounded-lg border border-[var(--ts-border)] bg-[rgba(255,255,255,0.02)] p-3">
              <input
                class="text-sm text-[var(--ts-text-muted)]"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                [disabled]="imageUploading() || saving()"
                (change)="uploadProductImage($event)"
              />
              @if (imageUploading()) {
                <span class="text-xs text-[var(--ts-brand)]">Subiendo imagen...</span>
              }
              @if (product.imageUrl) {
                <div class="flex items-center gap-3 rounded-lg border border-[var(--ts-border)] bg-[rgba(255,255,255,0.03)] p-2">
                  <img
                    class="h-24 w-24 shrink-0 rounded-lg object-contain bg-white"
                    [src]="imageSrc(product.imageUrl) || fallbackImage"
                    alt="Vista previa del producto"
                    (error)="onImagePreviewError($event)"
                  />
                  <div class="min-w-0 text-xs text-[var(--ts-text-muted)]">
                    <div class="font-bold text-[var(--ts-text)]">Vista previa</div>
                    <div class="truncate">{{ product.imageUrl }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
          <label class="form-label">
            Descripcion
            <textarea pTextarea name="description" rows="3" [(ngModel)]="product.description" required maxlength="500"></textarea>
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label class="form-label">
              Precio (S/)
              <p-inputnumber name="price" [(ngModel)]="product.price" mode="decimal" [min]="0.01" [minFractionDigits]="2" [maxFractionDigits]="2" styleClass="w-full" />
            </label>
            <label class="form-label">
              Stock
              <p-inputnumber name="stock" [(ngModel)]="product.stock" [min]="0" [showButtons]="true" styleClass="w-full" />
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <p-button label="Cancelar" type="button" severity="secondary" [text]="true" (onClick)="showProductDialog.set(false)" />
          <p-button [label]="editProductId() ? 'Actualizar' : 'Guardar'" type="submit" icon="pi pi-check" [loading]="saving()" [disabled]="imageUploading()" />
        </div>
      </form>
    </p-dialog>

    <!-- MODAL CATEGORIA -->
    <p-dialog
      [header]="editCategoryId() ? 'Editar Categoria' : 'Nueva Categoria'"
      [modal]="true"
      [(visible)]="showCategoryDialog"
      [style]="{ width: '25rem' }"
      [breakpoints]="{ '640px': '92vw' }"
      [draggable]="false"
      [dismissableMask]="!saving()"
      [closeOnEscape]="!saving()"
      [closable]="!saving()"
    >
      <form (ngSubmit)="saveCategory()">
        <div class="mt-2">
          <label class="form-label">
            Nombre
            <input pInputText name="categoryName" [(ngModel)]="categoryName" required maxlength="80" placeholder="Ej. Laptops" autofocus />
          </label>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <p-button label="Cancelar" type="button" severity="secondary" [text]="true" (onClick)="showCategoryDialog.set(false)" />
          <p-button [label]="editCategoryId() ? 'Actualizar' : 'Guardar'" type="submit" icon="pi pi-check" [loading]="saving()" />
        </div>
      </form>
    </p-dialog>

    <!-- MODAL DETALLES DE PEDIDO -->
    <p-dialog
      header="Detalles del Pedido"
      [modal]="true"
      [(visible)]="showOrderDetailsDialog"
      [style]="{ width: '40rem' }"
      [breakpoints]="{ '768px': '92vw' }"
      [draggable]="false"
      [dismissableMask]="true"
      [closeOnEscape]="true"
    >
      @if (selectedOrder(); as order) {
        <div class="mt-2">
          <div class="flex justify-between items-center mb-4 pb-4 border-b border-[var(--ts-border)]">
            <div>
              <p class="text-sm font-bold text-[var(--ts-text-muted)]">Cliente</p>
              <p class="font-bold">{{ order.user.name }} ({{ order.user.email }})</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-[var(--ts-text-muted)]">Fecha</p>
              <p class="font-bold">{{ order.createdAt | date:'medium' }}</p>
            </div>
          </div>
          
          <h3 class="font-bold mb-3 text-[var(--ts-text)]">Productos ({{ order.items.length }})</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto pr-2">
            @for (item of order.items; track item.productId) {
              <div class="flex justify-between items-center bg-[var(--ts-surface-2)] p-3 rounded-lg border border-[var(--ts-border)]">
                <div>
                  <p class="font-bold text-sm">{{ item.productName }}</p>
                  <p class="text-xs text-[var(--ts-text-muted)]">{{ item.quantity }}x S/ {{ item.unitPrice | number:'1.2-2' }}</p>
                </div>
                <div class="font-bold text-[var(--ts-brand-light)]">
                  S/ {{ item.subtotal | number:'1.2-2' }}
                </div>
              </div>
            }
          </div>
          
          <div class="mt-4 pt-4 border-t border-[var(--ts-border)] flex justify-between items-center">
            <span class="font-bold uppercase tracking-widest text-[var(--ts-text-muted)]">Total a Pagar</span>
            <span class="text-2xl font-black text-[var(--ts-brand)]">S/ {{ order.total | number:'1.2-2' }}</span>
          </div>
        </div>
      }
      <div class="flex justify-end mt-6">
        <p-button label="Cerrar" type="button" severity="secondary" (onClick)="showOrderDetailsDialog.set(false)" />
      </div>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private readonly categoryApi = inject(CategoryApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly orderApi = inject(OrderApiService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private productFilterTimer: ReturnType<typeof setTimeout> | null = null;
  private orderFilterTimer: ReturnType<typeof setTimeout> | null = null;

  readonly activeTab = signal<'productos' | 'categorias' | 'pedidos'>('productos');

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly productsLoading = signal(false);
  readonly ordersLoading = signal(false);
  readonly categoriesError = signal(false);
  readonly productsError = signal(false);
  readonly ordersError = signal(false);
  readonly saving = signal(false);
  readonly imageUploading = signal(false);
  readonly productsTotalElements = signal(0);
  readonly ordersTotalElements = signal(0);
  readonly productPage = signal(0);
  readonly productPageSize = signal(10);
  readonly orderPage = signal(0);
  readonly orderPageSize = signal(10);
  
  readonly fallbackImage = 'https://placehold.co/96x72/16162A/F1F0FF?text=No+Img';

  readonly showProductDialog = signal(false);
  readonly editProductId = signal<number | null>(null);
  
  readonly showCategoryDialog = signal(false);
  readonly editCategoryId = signal<number | null>(null);

  readonly showOrderDetailsDialog = signal(false);
  readonly selectedOrder = signal<Order | null>(null);

  categoryName = '';
  product: ProductRequest = this.emptyProduct();
  productFilters: ProductFilters = this.emptyProductFilters();
  orderFilters: OrderFilters = this.emptyOrderFilters();

  readonly stockOptions: SelectOption<ProductStockStatus>[] = [
    { label: 'Con stock', value: 'IN_STOCK' },
    { label: 'Sin stock', value: 'OUT_OF_STOCK' },
    { label: 'Stock bajo', value: 'LOW_STOCK' },
  ];
  readonly activeOptions: SelectOption<boolean>[] = [
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false },
  ];
  readonly orderStatusOptions: SelectOption<OrderStatus>[] = [
    { label: 'Pendiente de pago', value: 'PENDING_PAYMENT' },
    { label: 'Confirmado', value: 'CONFIRMED' },
    { label: 'Cancelado', value: 'CANCELLED' },
    { label: 'Entregado', value: 'DELIVERED' },
  ];
  readonly productSortOptions: SelectOption<string>[] = [
    { label: 'Nombre A-Z', value: 'name,asc' },
    { label: 'Nombre Z-A', value: 'name,desc' },
    { label: 'Precio menor', value: 'price,asc' },
    { label: 'Precio mayor', value: 'price,desc' },
    { label: 'Stock menor', value: 'stock,asc' },
    { label: 'Stock mayor', value: 'stock,desc' },
    { label: 'Fecha reciente', value: 'createdAt,desc' },
    { label: 'Fecha antigua', value: 'createdAt,asc' },
  ];
  readonly orderSortOptions: SelectOption<string>[] = [
    { label: 'Fecha reciente', value: 'createdAt,desc' },
    { label: 'Fecha antigua', value: 'createdAt,asc' },
    { label: 'Total menor', value: 'total,asc' },
    { label: 'Total mayor', value: 'total,desc' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  categoryOptions(): SelectOption<number>[] {
    return this.categories()
      .filter(category => category.active)
      .map(category => ({ label: category.name, value: category.id }));
  }

  productCategoryOptions(): SelectOption<string>[] {
    return this.categories().map(category => ({ label: category.name, value: category.name }));
  }

  reload(): void {
    this.loading.set(true);
    this.categoriesError.set(false);
    this.categoryApi.list(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: categories => {
          this.categories.set(categories);
          this.categoriesError.set(false);
          this.loadProducts({ page: this.productPage(), size: this.productPageSize() });
          this.loadOrders({ page: this.orderPage(), size: this.orderPageSize() });
          this.loading.set(false);
        },
        error: () => {
          this.categoriesError.set(true);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorias.' });
          this.loading.set(false);
        },
      });
  }

  applyProductFilters(): void {
    this.clearProductFilterTimer();
    this.loadProducts({ page: 0, size: this.productPageSize() });
  }

  scheduleProductFilters(): void {
    this.clearProductFilterTimer();
    this.productFilterTimer = setTimeout(() => this.applyProductFilters(), 350);
  }

  clearProductFilters(): void {
    this.clearProductFilterTimer();
    this.productFilters = this.emptyProductFilters();
    this.loadProducts({ page: 0, size: this.productPageSize() });
  }

  retryProducts(): void {
    this.loadProducts({ page: this.productPage(), size: this.productPageSize() });
  }

  productTotalPages(): number {
    return Math.max(1, Math.ceil(this.productsTotalElements() / this.productPageSize()));
  }

  previousProductsPage(): void {
    if (this.productPage() === 0) return;
    this.loadProducts({ page: this.productPage() - 1, size: this.productPageSize() });
  }

  nextProductsPage(): void {
    if (this.productPage() >= this.productTotalPages() - 1) return;
    this.loadProducts({ page: this.productPage() + 1, size: this.productPageSize() });
  }

  onProductsLazyLoad(event: LazyPageEvent): void {
    const rows = event.rows ?? this.productPageSize();
    const first = event.first ?? 0;
    this.loadProducts({ page: Math.floor(first / rows), size: rows });
  }

  applyOrderFilters(): void {
    this.clearOrderFilterTimer();
    this.loadOrders({ page: 0, size: this.orderPageSize() });
  }

  scheduleOrderFilters(): void {
    this.clearOrderFilterTimer();
    this.orderFilterTimer = setTimeout(() => this.applyOrderFilters(), 350);
  }

  clearOrderFilters(): void {
    this.clearOrderFilterTimer();
    this.orderFilters = this.emptyOrderFilters();
    this.loadOrders({ page: 0, size: this.orderPageSize() });
  }

  retryOrders(): void {
    this.loadOrders({ page: this.orderPage(), size: this.orderPageSize() });
  }

  orderTotalPages(): number {
    return Math.max(1, Math.ceil(this.ordersTotalElements() / this.orderPageSize()));
  }

  previousOrdersPage(): void {
    if (this.orderPage() === 0) return;
    this.loadOrders({ page: this.orderPage() - 1, size: this.orderPageSize() });
  }

  nextOrdersPage(): void {
    if (this.orderPage() >= this.orderTotalPages() - 1) return;
    this.loadOrders({ page: this.orderPage() + 1, size: this.orderPageSize() });
  }

  onOrdersLazyLoad(event: LazyPageEvent): void {
    const rows = event.rows ?? this.orderPageSize();
    const first = event.first ?? 0;
    this.loadOrders({ page: Math.floor(first / rows), size: rows });
  }

  openProductDialog(existingProduct?: Product): void {
    if (existingProduct) {
      this.editProductId.set(existingProduct.id);
      this.product = {
        name: existingProduct.name,
        categoryId: existingProduct.categoryId,
        description: existingProduct.description,
        imageUrl: existingProduct.imageUrl,
        price: existingProduct.price,
        stock: existingProduct.stock,
        active: existingProduct.active
      };
    } else {
      this.editProductId.set(null);
      this.product = this.emptyProduct();
    }
    this.showProductDialog.set(true);
  }

  openCategoryDialog(existingCategory?: Category): void {
    if (existingCategory) {
      this.editCategoryId.set(existingCategory.id);
      this.categoryName = existingCategory.name;
    } else {
      this.editCategoryId.set(null);
      this.categoryName = '';
    }
    this.showCategoryDialog.set(true);
  }

  uploadProductImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'warn', summary: 'Archivo invalido', detail: 'Selecciona una imagen valida.' });
      return;
    }

    this.imageUploading.set(true);
    this.productApi.uploadImage(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.product.imageUrl = response.imageUrl;
          this.imageUploading.set(false);
          this.messageService.add({ severity: 'success', summary: 'Imagen subida', detail: 'La imagen se guardo en Google Drive.' });
        },
        error: (error: HttpErrorResponse) => {
          this.imageUploading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorDetail(error, 'No se pudo subir la imagen.') });
        },
      });
  }

  imageSrc(url: string | null | undefined): string | null {
    return displayImageUrl(url);
  }

  onImagePreviewError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackImage;
  }

  private errorDetail(error: HttpErrorResponse, fallback: string): string {
    const details = error.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      return details.join(' ');
    }
    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }

  saveCategory(): void {
    const name = this.categoryName.trim();
    if (!name) return;
    
    this.saving.set(true);
    
    const request = { name, active: true };
    const apiCall = this.editCategoryId() 
      ? this.categoryApi.update(this.editCategoryId()!, request)
      : this.categoryApi.create(request);

    apiCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showCategoryDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editCategoryId() ? 'Categoría actualizada' : 'Categoría creada' });
        this.saving.set(false);
        this.reload();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la categoría.' });
        this.saving.set(false);
      },
    });
  }

  saveProduct(): void {
    if (!this.product.name.trim() || !this.product.description.trim() || !this.product.categoryId) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Completa nombre, categoria y descripcion.' });
      return;
    }
    this.saving.set(true);
    
    const request: ProductRequest = {
      ...this.product,
      name: this.product.name.trim(),
      description: this.product.description.trim(),
      imageUrl: this.product.imageUrl?.trim() || null,
    };

    const apiCall = this.editProductId()
      ? this.productApi.update(this.editProductId()!, request)
      : this.productApi.create(request);

    apiCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showProductDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editProductId() ? 'Producto actualizado' : 'Producto creado' });
        this.saving.set(false);
        this.loadProducts();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el producto.' });
        this.saving.set(false);
      },
    });
  }

  toggleProductActive(product: Product): void {
    const request: ProductRequest = {
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      stock: product.stock,
      active: !product.active
    };
    
    this.productApi.update(product.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ 
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `El producto "${product.name}" está ahora ${request.active ? 'activo' : 'inactivo'}.` });
          this.loadProducts();
        }, 
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.' }) 
      });
  }

  toggleCategoryActive(category: Category): void {
    const request = { name: category.name, active: !category.active };
    this.categoryApi.update(category.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ 
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `La categoría "${category.name}" está ahora ${request.active ? 'activa' : 'inactiva'}.` });
          this.reload();
        }, 
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.' }) 
      });
  }

  updateOrderStatus(orderId: number, status: OrderStatus): void {
    this.ordersLoading.set(true);
    this.orderApi.updateStatus(orderId, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Estado actualizado', detail: `El pedido #${orderId} se marcó como ${status === 'DELIVERED' ? 'Entregado' : 'Cancelado'}.` });
          this.loadOrders({ page: this.orderPage(), size: this.orderPageSize() });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado del pedido.' });
          this.ordersLoading.set(false);
        }
      });
  }

  openOrderDetails(order: Order): void {
    this.selectedOrder.set(order);
    this.showOrderDetailsDialog.set(true);
  }

  orderStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Pendiente de pago';
      case 'CONFIRMED': return 'Confirmado';
      case 'DELIVERED': return 'Entregado';
      case 'CANCELLED': return 'Cancelado';
    }
  }

  orderStatusClass(status: OrderStatus): string {
    switch (status) {
      case 'PENDING_PAYMENT': return 'status-badge-pending';
      case 'CONFIRMED': return 'status-badge-confirmed';
      case 'DELIVERED': return 'ts-badge-success';
      case 'CANCELLED': return 'ts-badge-danger';
    }
  }

  private loadProducts(overrides: ProductFilters = {}): void {
    const filters = this.cleanProductFilters({ ...this.productFilters, ...overrides, includeInactive: true });
    this.productPage.set(filters.page ?? 0);
    this.productPageSize.set(filters.size ?? 10);
    this.productsLoading.set(true);
    this.productsError.set(false);

    this.productApi.list(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.products.set(response.content);
          this.productsTotalElements.set(response.totalElements);
          this.productsError.set(false);
          this.productsLoading.set(false);
        },
        error: () => {
          this.productsError.set(true);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos.' });
          this.productsLoading.set(false);
        },
      });
  }

  private loadOrders(overrides: OrderFilters = {}): void {
    const filters = this.cleanOrderFilters({ ...this.orderFilters, ...overrides, scope: 'all' });
    this.orderPage.set(filters.page ?? 0);
    this.orderPageSize.set(filters.size ?? 10);
    this.ordersLoading.set(true);
    this.ordersError.set(false);

    this.orderApi.list(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.orders.set(response.content);
          this.ordersTotalElements.set(response.totalElements);
          this.ordersError.set(false);
          this.ordersLoading.set(false);
        },
        error: () => {
          this.ordersError.set(true);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos.' });
          this.ordersLoading.set(false);
        }
      });
  }

  private emptyProductFilters(): ProductFilters {
    return {
      page: 0,
      size: 10,
      sort: 'createdAt,desc',
      includeInactive: true,
    };
  }

  private emptyOrderFilters(): OrderFilters {
    return {
      scope: 'all',
      page: 0,
      size: 10,
      sort: 'createdAt,desc',
    };
  }

  private cleanProductFilters(filters: ProductFilters): ProductFilters {
    return {
      page: filters.page ?? 0,
      size: filters.size ?? 10,
      sort: filters.sort || 'createdAt,desc',
      includeInactive: true,
      q: this.cleanString(filters.q),
      category: this.cleanString(filters.category),
      stockStatus: filters.stockStatus,
      active: filters.active,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      createdFrom: this.cleanString(filters.createdFrom),
      createdTo: this.cleanString(filters.createdTo),
    };
  }

  private cleanOrderFilters(filters: OrderFilters): OrderFilters {
    return {
      scope: 'all',
      page: filters.page ?? 0,
      size: filters.size ?? 10,
      sort: filters.sort || 'createdAt,desc',
      status: filters.status,
      userName: this.cleanString(filters.userName),
      userEmail: this.cleanString(filters.userEmail),
      productName: this.cleanString(filters.productName),
      from: this.cleanString(filters.from),
      to: this.cleanString(filters.to),
      minTotal: filters.minTotal ?? undefined,
      maxTotal: filters.maxTotal ?? undefined,
    };
  }

  private cleanString(value: string | undefined): string | undefined {
    const clean = value?.trim();
    return clean || undefined;
  }

  private clearProductFilterTimer(): void {
    if (this.productFilterTimer) {
      clearTimeout(this.productFilterTimer);
      this.productFilterTimer = null;
    }
  }

  private clearOrderFilterTimer(): void {
    if (this.orderFilterTimer) {
      clearTimeout(this.orderFilterTimer);
      this.orderFilterTimer = null;
    }
  }

  private emptyProduct(): ProductRequest {
    return {
      name: '',
      categoryId: null,
      description: '',
      imageUrl: null,
      price: 0.01,
      stock: 0,
      active: true,
    };
  }
}
