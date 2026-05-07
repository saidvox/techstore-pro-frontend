import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';

import { Product } from '../../core/models/product.model';
import { CartStore } from '../cart/cart.store';
import { CatalogStore } from './catalog.store';

// ── Mapa ícono/color por categoría ─────────────────────────────────────────
const CAT_CFG: Record<string, { icon: string; color: string; bg: string }> = {
  'Laptops':        { icon: 'pi pi-desktop',    color: '#6C63FF', bg: 'rgba(108,99,255,0.13)' },
  'Smartphones':    { icon: 'pi pi-mobile',     color: '#10B981', bg: 'rgba(16,185,129,0.13)'  },
  'Monitores':      { icon: 'pi pi-desktop',    color: '#F59E0B', bg: 'rgba(245,158,11,0.13)'  },
  'Tablets':        { icon: 'pi pi-tablet',     color: '#3B82F6', bg: 'rgba(59,130,246,0.13)'  },
  'Teclados':       { icon: 'pi pi-keyboard',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.13)'  },
  'Mouse':          { icon: 'pi pi-arrows-alt', color: '#EC4899', bg: 'rgba(236,72,153,0.13)'  },
  'Audifonos':      { icon: 'pi pi-headphones', color: '#14B8A6', bg: 'rgba(20,184,166,0.13)'  },
  'Almacenamiento': { icon: 'pi pi-database',   color: '#F97316', bg: 'rgba(249,115,22,0.13)'  },
  'Componentes':    { icon: 'pi pi-cog',        color: '#EF4444', bg: 'rgba(239,68,68,0.13)'   },
  'Camaras':        { icon: 'pi pi-camera',     color: '#A78BFA', bg: 'rgba(167,139,250,0.13)' },
  'Impresoras':     { icon: 'pi pi-print',      color: '#34D399', bg: 'rgba(52,211,153,0.13)'  },
};
const DEF_CFG = { icon: 'pi pi-box', color: '#6C63FF', bg: 'rgba(108,99,255,0.13)' };

interface LazyPageEvent { first?: number | null; rows?: number | null; }

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [DecimalPipe, FormsModule, ButtonModule, InputNumberModule, InputTextModule, SelectModule, SkeletonModule, RouterLink],
  styles: [`
    /* ── Layout ─────────────────────────────────────────── */
    .catalog-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .catalog-layout { grid-template-columns: 1fr; }
      .sidebar { display: none; }
    }

    /* ── Sidebar ─────────────────────────────────────────── */
    .sidebar {
      position: sticky;
      top: 80px;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .sidebar-title {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ts-brand);
    }
    .filter-label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--ts-text-muted);
    }
    .filter-input {
      width: 100%;
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 10px !important;
      color: var(--ts-text) !important;
      padding: 0.55rem 0.75rem !important;
      font-family: 'Outfit', sans-serif !important;
      font-size: 0.875rem !important;
      transition: border-color 0.2s;
    }
    .filter-input:focus { border-color: var(--ts-brand) !important; outline: none !important; }
    .filter-input::placeholder { color: var(--ts-text-dim) !important; }
    .divider {
      border: none;
      border-top: 1px solid var(--ts-border);
      margin: 0;
    }
    /* Cat pills */
    .cat-pill {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ts-text-muted);
      background: transparent;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }
    .cat-pill:hover { background: var(--ts-surface-2); color: var(--ts-text); }
    .cat-pill.active { background: rgba(108,99,255,0.12); border-color: rgba(108,99,255,0.35); color: var(--ts-brand); }

    /* ── Grid productos ──────────────────────────────────── */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    /* ── Product card ────────────────────────────────────── */
    .p-card {
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
      display: flex;
      flex-direction: column;
    }
    .p-card:hover {
      border-color: var(--ts-brand);
      box-shadow: 0 0 32px rgba(108,99,255,0.22);
      transform: translateY(-4px);
    }
    .p-card-img-wrap {
      position: relative;
      height: 190px;
      background: #0d0d1c;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .p-card-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 16px;
      transition: transform 0.3s ease;
    }
    .p-card:hover .p-card-img { transform: scale(1.06); }
    .p-card-icon {
      font-size: 3rem;
    }
    .p-card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .p-card-cat {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .p-card-name {
      font-weight: 700;
      font-size: 0.9rem;
      line-height: 1.35;
      color: var(--ts-text);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .p-card-desc {
      font-size: 0.75rem;
      color: var(--ts-text-dim);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }
    .p-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.5rem;
    }
    .p-card-price { font-weight: 800; font-size: 1.1rem; color: var(--ts-text); }
    .p-card-price-label { font-size: 0.68rem; color: var(--ts-text-dim); font-weight: 500; }
    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.9rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8rem;
      color: #fff;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
      font-family: 'Outfit', sans-serif;
    }
    .add-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
    .add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* badge stock */
    .stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 999px;
    }

    /* ── Paginación ──────────────────────────────────────── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding-top: 1.5rem;
    }
    .page-btn {
      min-width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--ts-border);
      background: var(--ts-card);
      color: var(--ts-text-muted);
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--ts-brand); color: var(--ts-brand); }
    .page-btn.active { background: var(--ts-brand); border-color: var(--ts-brand); color: #fff; }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ── Skeleton ────────────────────────────────────────── */
    .skel {
      border-radius: 16px;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      animation: skel-pulse 1.8s ease-in-out infinite;
      height: 300px;
    }
    @keyframes skel-pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.35; }
    }

    /* override PrimeNG select/input dentro del sidebar */
    ::ng-deep .ts-select .p-select {
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 10px !important;
      color: var(--ts-text) !important;
      width: 100% !important;
    }
    ::ng-deep .ts-select .p-select:hover,
    ::ng-deep .ts-select .p-select.p-focus {
      border-color: var(--ts-brand) !important;
    }
    ::ng-deep .ts-select .p-select-label {
      color: var(--ts-text) !important;
      font-family: 'Outfit', sans-serif !important;
      font-size: 0.875rem !important;
    }
    ::ng-deep .ts-select .p-select-dropdown { color: var(--ts-text-muted) !important; }
    ::ng-deep .filter-label .p-inputnumber,
    ::ng-deep .filter-label .p-inputnumber-input {
      width: 100%;
    }
    ::ng-deep .filter-label .p-inputnumber-input {
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 10px !important;
      color: var(--ts-text) !important;
      font-family: 'Outfit', sans-serif !important;
      font-size: 0.875rem !important;
      padding: 0.55rem 0.75rem !important;
    }
  `],
  template: `
  <div style="background: var(--ts-surface); min-height: 100vh;">

    <!-- Page Header -->
    <div style="background: var(--ts-surface-2); border-bottom: 1px solid var(--ts-border);">
      <div class="max-w-7xl mx-auto px-4 py-5 sm:px-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color: var(--ts-brand);">Productos</p>
            <h1 class="text-3xl font-black" style="color: var(--ts-text);">Catálogo</h1>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm" style="color: var(--ts-text-muted);">
              {{ store.totalElements() }} productos
            </span>
            <button class="ts-btn-brand px-4 py-2 text-sm flex items-center gap-2"
              [class.opacity-60]="store.loading()"
              (click)="store.reload()">
              <i class="pi pi-refresh text-xs" [class.animate-spin]="store.loading()"></i>
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main layout -->
    <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6">
      <div class="catalog-layout">

        <!-- ══════════════════════════════════
             SIDEBAR — Filtros
        ═══════════════════════════════════ -->
        <aside class="sidebar">
          <p class="sidebar-title">Filtros</p>

          <!-- Búsqueda -->
          <label class="filter-label">
            <span>Buscar</span>
            <div style="position:relative;">
              <i class="pi pi-search" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:var(--ts-text-dim);font-size:0.8rem;"></i>
              <input
                class="filter-input"
                style="padding-left:2.2rem !important;"
                type="search"
                placeholder="Nombre o descripción…"
                [(ngModel)]="q"
                (keyup.enter)="applyFilters()"
              />
            </div>
          </label>

          <hr class="divider">

          <!-- Categorías como pills -->
          <div>
            <p class="sidebar-title mb-3">Categoría</p>
            <div class="flex flex-col gap-1">
              <button class="cat-pill" [class.active]="!category" (click)="selectCategory(null)">
                <i class="pi pi-th-large text-xs"></i> Todas
              </button>
              @for (opt of store.categoryOptions(); track opt.value) {
                <button
                  class="cat-pill"
                  [class.active]="category === opt.value"
                  (click)="selectCategory(opt.value)"
                >
                  <i [class]="getCatIcon(opt.value) + ' text-xs'" [style.color]="getCatColor(opt.value)"></i>
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>

          <hr class="divider">

          <!-- Precio -->
          <div>
            <p class="sidebar-title mb-3">Precio</p>
            <div class="grid grid-cols-2 gap-3">
              <label class="filter-label">
                <span>Min.</span>
                <p-inputnumber
                  [(ngModel)]="minPrice"
                  mode="decimal"
                  [min]="0"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  (onInput)="applyFilters()"
                  placeholder="S/ 0.00"
                />
              </label>
              <label class="filter-label">
                <span>Max.</span>
                <p-inputnumber
                  [(ngModel)]="maxPrice"
                  mode="decimal"
                  [min]="0"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  (onInput)="applyFilters()"
                  placeholder="S/ 0.00"
                />
              </label>
            </div>
          </div>

          <hr class="divider">

          <!-- Orden -->
          <label class="filter-label">
            <span>Ordenar por</span>
            <p-select
              [options]="sortOptions"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="sort"
              (onChange)="applyFilters()"
              placeholder="Orden"
              styleClass="ts-select"
              appendTo="body"
            />
          </label>

          <hr class="divider">

          <!-- Botón limpiar -->
          <button class="cat-pill" (click)="clearFilters()" style="justify-content:center; border-color: var(--ts-border);">
            <i class="pi pi-times text-xs"></i> Limpiar filtros
          </button>
        </aside>

        <!-- ══════════════════════════════════
             CONTENIDO — Grid de productos
        ═══════════════════════════════════ -->
        <div>

          <!-- Error -->
          @if (store.error()) {
            <div class="flex items-center gap-3 p-4 rounded-xl mb-4"
              style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);">
              <i class="pi pi-exclamation-triangle" style="color:#EF4444;"></i>
              <span class="text-sm font-semibold" style="color:#EF4444;">{{ store.error() }}</span>
            </div>
          }

          <!-- Skeleton loading -->
          @if (store.loading()) {
            <div class="products-grid">
              @for (i of [1,2,3,4,5,6,7,8]; track i) {
                <div class="skel"></div>
              }
            </div>
          }

          <!-- Grid de productos -->
          @if (!store.loading()) {
            @if (store.products().length === 0) {
              <div class="flex flex-col items-center justify-center py-24 gap-4">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style="background: rgba(108,99,255,0.1);">
                  <i class="pi pi-search text-3xl" style="color: var(--ts-brand);"></i>
                </div>
                <h3 class="text-xl font-bold" style="color: var(--ts-text);">Sin resultados</h3>
                <p class="text-sm text-center" style="color: var(--ts-text-muted);">
                  No se encontraron productos con los filtros actuales.
                </p>
                <button class="ts-btn-brand px-5 py-2 text-sm" (click)="clearFilters()">
                  Limpiar filtros
                </button>
              </div>
            } @else {
              <div class="products-grid">
                @for (product of store.products(); track product.id) {
                  <article class="p-card" [routerLink]="['/catalogo', product.id]">
                    <!-- Imagen -->
                    <div class="p-card-img-wrap">
                      @if (product.imageUrl) {
                        <img
                          [src]="product.imageUrl"
                          [alt]="product.name"
                          class="p-card-img"
                          loading="lazy"
                          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                        />
                        <div class="p-card-img-wrap" style="display:none;position:absolute;inset:0;">
                          <i [class]="getCatIcon(product.category) + ' p-card-icon'"
                             [style.color]="getCatColor(product.category)"></i>
                        </div>
                      } @else {
                        <i [class]="getCatIcon(product.category) + ' p-card-icon'"
                           [style.color]="getCatColor(product.category)"></i>
                      }
                      <!-- Stock badge -->
                      <span class="stock-badge"
                        [style.background]="product.stock === 0 ? 'rgba(239,68,68,0.2)' : product.stock <= 5 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'"
                        [style.color]="product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#10B981'"
                      >
                        {{ product.stock === 0 ? 'Sin stock' : product.stock <= 5 ? 'Stock bajo' : 'Disponible' }}
                      </span>
                    </div>

                    <!-- Body -->
                    <div class="p-card-body">
                      <span class="p-card-cat"
                        [style.color]="getCatColor(product.category)">
                        {{ product.category }}
                      </span>
                      <h3 class="p-card-name">{{ product.name }}</h3>
                      <p class="p-card-desc">{{ product.description }}</p>

                      <div class="p-card-footer">
                        <div>
                          <p class="p-card-price-label">Precio</p>
                          <p class="p-card-price">S/ {{ product.price | number:'1.2-2' }}</p>
                        </div>
                        <button
                          class="add-btn"
                          [style.background]="product.stock > 0 ? getCatColor(product.category) : '#3D3D5A'"
                          [disabled]="product.stock === 0"
                          (click)="$event.preventDefault(); $event.stopPropagation(); addToCart(product)"
                        >
                          <i class="pi pi-shopping-cart" style="font-size:0.75rem;"></i>
                          Agregar
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>

              <!-- Paginación -->
              <div class="pagination">
                <button class="page-btn" [disabled]="store.page() === 0"
                  (click)="goToPage(store.page() - 1)">
                  <i class="pi pi-chevron-left" style="font-size:0.75rem;"></i>
                </button>

                @for (p of pages(); track p) {
                  <button class="page-btn" [class.active]="p === store.page()"
                    (click)="goToPage(p)">
                    {{ p + 1 }}
                  </button>
                }

                <button class="page-btn" [disabled]="store.page() >= totalPages() - 1"
                  (click)="goToPage(store.page() + 1)">
                  <i class="pi pi-chevron-right" style="font-size:0.75rem;"></i>
                </button>
              </div>
            }
          }
        </div>

      </div>
    </div>
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage implements OnInit {
  readonly store = inject(CatalogStore);
  private readonly cart = inject(CartStore);
  private readonly messageService = inject(MessageService);

  q            = '';
  category: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sort = 'name,asc';
  readonly sortOptions = [
    { label: 'Nombre A-Z', value: 'name,asc' },
    { label: 'Nombre Z-A', value: 'name,desc' },
    { label: 'Precio menor', value: 'price,asc' },
    { label: 'Precio mayor', value: 'price,desc' },
  ];

  ngOnInit(): void {
    const current = this.store.filters();
    this.q = current.q || '';
    this.category = current.category || null;
    this.minPrice = current.minPrice ?? null;
    this.maxPrice = current.maxPrice ?? null;
    this.sort = current.sort || 'name,asc';

    this.store.loadCategories();
    this.store.load();
  }

  // ── Filtros ──────────────────────────────────────────────
  selectCategory(cat: string | null): void {
    this.category = cat;
    this.applyFilters();
  }

  applyFilters(): void {
    this.store.applyFilters({
      q: this.q || undefined,
      category: this.category || undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      sort: this.sort || undefined,
    });
  }

  clearFilters(): void {
    this.q = '';
    this.category = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.sort = 'name,asc';
    this.store.applyFilters({
      q: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: this.sort,
    });
  }

  // ── Paginación ───────────────────────────────────────────
  totalPages(): number {
    return Math.ceil(this.store.totalElements() / this.store.size()) || 1;
  }

  pages(): number[] {
    const total = this.totalPages();
    const current = this.store.page();
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    return range;
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.store.setPage(page, this.store.size());
  }

  // ── Carrito ──────────────────────────────────────────────
  addToCart(product: Product): void {
    if (product.stock === 0) return;
    this.cart.addProduct(product);
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Agregado al carrito', 
      detail: `${product.name} fue añadido a tu carrito.`, 
      life: 3000 
    });
  }

  // ── Helpers categoría ────────────────────────────────────
  getCatIcon(category: string): string {
    return (CAT_CFG[category] ?? DEF_CFG).icon;
  }

  getCatColor(category: string): string {
    return (CAT_CFG[category] ?? DEF_CFG).color;
  }
}
