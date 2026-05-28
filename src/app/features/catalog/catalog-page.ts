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
import { SliderModule } from 'primeng/slider';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Product } from '../../core/models/product.model';
import { CartStore } from '../cart/cart.store';
import { CatalogStore } from './catalog.store';
import { displayImageUrl } from '../../core/utils/image-url.util';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { FavoriteApiService } from '../../core/services/favorite-api.service';

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
  imports: [DecimalPipe, FormsModule, ButtonModule, InputNumberModule, InputTextModule, SelectModule, SkeletonModule, SliderModule, DrawerModule, RouterLink],
  styles: [`
    .catalog-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .catalog-layout { grid-template-columns: 1fr; }
    }

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
    @media (max-width: 900px) {
      .sidebar { display: none; }
    }
    .sidebar-title {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ts-brand);
    }
    .fav-btn {
      position: absolute;
      top: .75rem;
      left: .75rem;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      border: 1px solid var(--ts-border);
      background: rgba(10,10,24,.78);
      color: var(--ts-text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: 3;
      transition: color .2s, border-color .2s, background .2s, transform .2s;
    }
    .fav-btn:hover { transform: translateY(-1px); color: #fb7185; border-color: rgba(251,113,133,.55); }
    .fav-btn.active { color: #fb7185; border-color: rgba(251,113,133,.6); background: rgba(251,113,133,.14); }
    .price-stack { display: flex; flex-direction: column; gap: .15rem; }
    .price-old { font-size: .75rem; color: var(--ts-text-muted); text-decoration: line-through; }
    .offer-badge {
      display: inline-flex;
      width: fit-content;
      padding: .15rem .45rem;
      border-radius: 999px;
      background: rgba(251,113,133,.16);
      color: #fb7185;
      font-size: .65rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
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

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }

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
      transition: opacity 0.2s, transform 0.15s, background-color 0.2s;
      font-family: 'Outfit', sans-serif;
      background: var(--ts-brand);
    }
    .add-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .add-btn:disabled { opacity: 1; background: var(--ts-surface-2) !important; color: var(--ts-text-muted) !important; cursor: not-allowed; border: 1px solid var(--ts-border); }

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

    .price-filter-panel {
      background: rgba(255,255,255,0.025);
      border: 1px solid var(--ts-border);
      border-radius: 12px;
      padding: 0.85rem;
    }
    .price-filter-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .price-filter-range {
      color: var(--ts-text);
      font-size: 0.78rem;
      font-weight: 800;
      line-height: 1.25;
      text-align: right;
      white-space: nowrap;
    }
    .price-filter-range span {
      color: var(--ts-text-dim);
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      margin-bottom: 0.1rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .price-slider-wrap {
      padding: 0.25rem 0.35rem 0.85rem;
    }
    .price-filter-limits {
      color: var(--ts-text-dim);
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      font-weight: 700;
      margin-top: 0.85rem;
    }
    ::ng-deep .price-slider.p-slider {
      background: rgba(255,255,255,0.08) !important;
      border-radius: 999px !important;
      height: 8px !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
    }
    ::ng-deep .price-slider.p-slider .p-slider-range {
      background: linear-gradient(90deg, #6c63ff, #00d4aa) !important;
      border-radius: 999px !important;
    }
    ::ng-deep .price-slider.p-slider .p-slider-handle {
      background: var(--ts-text) !important;
      border: 3px solid var(--ts-brand) !important;
      width: 18px !important;
      height: 18px !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 0 4px rgba(108,99,255,0.14) !important;
      transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s !important;
    }
    ::ng-deep .price-slider.p-slider .p-slider-handle:hover {
      transform: scale(1.15) !important;
      border-color: #00d4aa !important;
      box-shadow: 0 5px 16px rgba(0,0,0,0.4), 0 0 0 7px rgba(0,212,170,0.16) !important;
    }
    ::ng-deep .price-slider.p-slider .p-slider-handle:focus {
      box-shadow: 0 5px 16px rgba(0,0,0,0.4), 0 0 0 7px rgba(108,99,255,0.28) !important;
      outline: none !important;
    }
    .catalog-title-row {
      gap: 1rem;
    }
    .mobile-filter-card {
      display: none;
      background: linear-gradient(135deg, rgba(108,99,255,0.13), rgba(0,212,170,0.05));
      border: 1px solid rgba(108,99,255,0.28);
      border-radius: 16px;
      padding: 0.9rem;
      margin-bottom: 1rem;
      box-shadow: 0 14px 40px rgba(0,0,0,0.18);
    }
    .mobile-filter-button {
      align-items: center;
      background: var(--ts-brand);
      border: 0;
      border-radius: 12px;
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      font-weight: 800;
      gap: 0.55rem;
      justify-content: center;
      min-height: 44px;
      padding: 0.7rem 1rem;
      width: 100%;
    }
    .mobile-filter-summary {
      color: var(--ts-text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      justify-content: center;
      margin-top: 0.7rem;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .mobile-filter-summary span {
      background: rgba(255,255,255,0.055);
      border: 1px solid var(--ts-border);
      border-radius: 999px;
      padding: 0.3rem 0.55rem;
    }
    ::ng-deep .catalog-filter-drawer {
      background: var(--ts-card) !important;
      border-right: 1px solid var(--ts-border) !important;
      color: var(--ts-text) !important;
      max-width: min(90vw, 360px) !important;
      width: min(90vw, 360px) !important;
    }
    ::ng-deep .catalog-filter-drawer .p-drawer-header {
      border-bottom: 1px solid var(--ts-border);
      padding: 1rem 1.15rem;
    }
    ::ng-deep .catalog-filter-drawer .p-drawer-content {
      padding: 1rem;
    }
    .drawer-filter-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .catalog-layout {
        gap: 1rem;
      }
      .catalog-title-row {
        align-items: flex-start;
        flex-direction: column;
      }
      .mobile-filter-card { display: block; }
      .cat-pill {
        min-height: 40px;
      }
      .products-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .p-card {
        border-radius: 14px;
      }
      .p-card-img-wrap {
        height: 190px;
      }
      .p-card-img {
        padding: 14px;
      }
      .p-card-body {
        gap: 0.5rem;
        padding: 1rem;
      }
      .p-card-name {
        font-size: 0.96rem;
      }
      .p-card-desc {
        font-size: 0.78rem;
      }
      .p-card-footer {
        align-items: stretch;
        flex-direction: column;
        gap: 0.65rem;
      }
      .p-card-price {
        font-size: 1rem;
      }
      .add-btn {
        justify-content: center;
        min-height: 40px;
        padding: 0.55rem 0.65rem;
        width: 100%;
      }
      .stock-badge {
        font-size: 0.58rem;
        right: 7px;
        top: 7px;
      }
      .pagination {
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .page-btn {
        height: 40px;
        min-width: 40px;
      }
      .price-filter-limits {
        gap: 0.5rem;
      }
    }
  `],
  template: `
  <div style="background: var(--ts-surface); min-height: 100vh;">

    <!-- Page Header -->
    <div style="background: var(--ts-surface-2); border-bottom: 1px solid var(--ts-border);">
      <div class="max-w-7xl mx-auto px-4 py-5 sm:px-6">
        <div class="catalog-title-row flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color: var(--ts-brand);">Productos</p>
            <h1 class="text-3xl font-black" style="color: var(--ts-text);">Catálogo</h1>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm" style="color: var(--ts-text-muted);">
              {{ store.totalElements() }} productos
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main layout -->
    <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6">
      <div class="mobile-filter-card">
        <button class="mobile-filter-button" type="button" (click)="filtersOpen.set(true)">
          <i class="pi pi-sliders-h"></i>
          Filtros y orden
        </button>
        <div class="mobile-filter-summary">
          <span>{{ category || 'Todas las categorias' }}</span>
          <span>S/ {{ priceRange[0] | number:'1.0-0' }} - S/ {{ priceRange[1] | number:'1.0-0' }}</span>
        </div>
      </div>

      <p-drawer
        [visible]="filtersOpen()"
        (visibleChange)="filtersOpen.set($event)"
        position="left"
        styleClass="catalog-filter-drawer"
        header="Filtrar catalogo">
        <div class="drawer-filter-content">
          <p class="sidebar-title">Filtros</p>

          <label class="filter-label">
            <span>Buscar</span>
            <div style="position:relative;">
              <i class="pi pi-search" style="position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:var(--ts-text-dim);font-size:0.8rem;"></i>
              <input
                class="filter-input"
                style="padding-left:2.2rem !important;"
                type="search"
                placeholder="Nombre o descripcion..."
                [(ngModel)]="q"
                (keyup.enter)="applyFilters()"
              />
            </div>
          </label>

          <hr class="divider">

          <div>
            <p class="sidebar-title mb-3">Categoria</p>
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

          <div class="price-filter-panel">
            <div class="price-filter-head">
              <p class="sidebar-title mb-0">Precio</p>
              <p class="price-filter-range">
                <span>Rango actual</span>
                S/ {{ priceRange[0] | number:'1.0-0' }} - S/ {{ priceRange[1] | number:'1.0-0' }}
              </p>
            </div>

            <div class="price-slider-wrap">
              <p-slider
                [(ngModel)]="priceRange"
                [range]="true"
                [min]="0"
                [max]="10000"
                [step]="50"
                styleClass="price-slider"
                ariaLabel="Filtrar por rango de precio"
                (onChange)="previewPriceRange()"
                (onSlideEnd)="commitPriceRange()"
              />
              <div class="price-filter-limits" aria-hidden="true">
                <span>S/ 0</span>
                <span>S/ 10,000</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="filter-label">
                <p-inputnumber
                  [(ngModel)]="minPrice"
                  mode="decimal"
                  [min]="0"
                  [max]="maxPrice || 10000"
                  [minFractionDigits]="0"
                  [maxFractionDigits]="2"
                  (onInput)="previewPriceInputs()"
                  (onBlur)="commitPriceInputs()"
                  (onKeyDown)="commitPriceInputOnEnter($event)"
                  placeholder="Min"
                />
              </label>
              <label class="filter-label">
                <p-inputnumber
                  [(ngModel)]="maxPrice"
                  mode="decimal"
                  [min]="minPrice || 0"
                  [max]="10000"
                  [minFractionDigits]="0"
                  [maxFractionDigits]="2"
                  (onInput)="previewPriceInputs()"
                  (onBlur)="commitPriceInputs()"
                  (onKeyDown)="commitPriceInputOnEnter($event)"
                  placeholder="Max"
                />
              </label>
            </div>
          </div>

          <hr class="divider">

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

          <div class="grid grid-cols-2 gap-3">
            <button class="cat-pill" (click)="clearFilters()" style="justify-content:center; border-color: var(--ts-border);">
              <i class="pi pi-times text-xs"></i> Limpiar
            </button>
            <button class="cat-pill active" (click)="filtersOpen.set(false)" style="justify-content:center;">
              <i class="pi pi-check text-xs"></i> Ver productos
            </button>
          </div>
        </div>
      </p-drawer>

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
          <div class="price-filter-panel">
            <div class="price-filter-head">
              <p class="sidebar-title mb-0">Precio</p>
              <p class="price-filter-range">
                <span>Rango actual</span>
                S/ {{ priceRange[0] | number:'1.0-0' }} - S/ {{ priceRange[1] | number:'1.0-0' }}
              </p>
            </div>
            
            <div class="price-slider-wrap">
              <p-slider 
                [(ngModel)]="priceRange" 
                [range]="true" 
                [min]="0" 
                [max]="10000" 
                [step]="50"
                styleClass="price-slider"
                ariaLabel="Filtrar por rango de precio"
                (onChange)="previewPriceRange()"
                (onSlideEnd)="commitPriceRange()"
              />
              <div class="price-filter-limits" aria-hidden="true">
                <span>S/ 0</span>
                <span>S/ 10,000</span>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <label class="filter-label">
                <p-inputnumber
                  [(ngModel)]="minPrice"
                  mode="decimal"
                  [min]="0"
                  [max]="maxPrice || 10000"
                  [minFractionDigits]="0"
                  [maxFractionDigits]="2"
                  (onInput)="previewPriceInputs()"
                  (onBlur)="commitPriceInputs()"
                  (onKeyDown)="commitPriceInputOnEnter($event)"
                  placeholder="Min"
                />
              </label>
              <label class="filter-label">
                <p-inputnumber
                  [(ngModel)]="maxPrice"
                  mode="decimal"
                  [min]="minPrice || 0"
                  [max]="10000"
                  [minFractionDigits]="0"
                  [maxFractionDigits]="2"
                  (onInput)="previewPriceInputs()"
                  (onBlur)="commitPriceInputs()"
                  (onKeyDown)="commitPriceInputOnEnter($event)"
                  placeholder="Max"
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
                      <button
                        type="button"
                        class="fav-btn"
                        [class.active]="product.favorite"
                        [attr.aria-label]="product.favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                        (click)="toggleFavorite($event, product)"
                      >
                        <i class="pi" [class.pi-heart-fill]="product.favorite" [class.pi-heart]="!product.favorite"></i>
                      </button>
                      @if (product.imageUrl) {
                        <img
                          [src]="imageSrc(product.imageUrl)"
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
                          <div class="price-stack">
                            @if (product.onOffer) {
                              <span class="offer-badge">-{{ product.discountPercentage }}%</span>
                              <span class="price-old">S/ {{ product.price | number:'1.2-2' }}</span>
                            }
                            <p class="p-card-price">S/ {{ (product.effectivePrice ?? product.price) | number:'1.2-2' }}</p>
                          </div>
                        </div>
                        <button
                          class="add-btn"
                          [disabled]="product.stock === 0"
                          (click)="$event.preventDefault(); $event.stopPropagation(); addToCart(product)"
                        >
                          <i class="pi pi-shopping-cart" style="font-size:0.75rem;"></i>
                          {{ product.stock === 0 ? 'Agotado' : 'Agregar' }}
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
  private readonly favoriteApi = inject(FavoriteApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  q            = '';
  category: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  priceRange: number[] = [0, 10000];
  sort = 'name,asc';
  readonly filtersOpen = signal(false);
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
    this.priceRange = [this.minPrice ?? 0, this.maxPrice ?? 10000];
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

  previewPriceRange(): void {
    this.syncPricesFromRange();
  }

  commitPriceRange(): void {
    this.syncPricesFromRange();
    this.applyFilters();
  }

  previewPriceInputs(): void {
    const min = this.minPrice ?? 0;
    const max = this.maxPrice ?? 10000;
    this.priceRange = [min, Math.max(min, max)];
  }

  commitPriceInputs(): void {
    this.previewPriceInputs();
    this.applyFilters();
  }

  commitPriceInputOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }

    this.commitPriceInputs();
  }

  clearFilters(): void {
    this.q = '';
    this.category = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.priceRange = [0, 10000];
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

  toggleFavorite(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.session.isAuthenticated()) {
      void this.router.navigate(['/auth/login']);
      return;
    }

    const nextFavorite = !product.favorite;
    const request: Observable<Product | void> = nextFavorite ? this.favoriteApi.add(product.id) : this.favoriteApi.remove(product.id);
    request.subscribe({
      next: () => {
        this.store.patchProductFavorite(product.id, nextFavorite);
        this.messageService.add({
          severity: 'success',
          summary: nextFavorite ? 'Favorito guardado' : 'Favorito eliminado',
          detail: product.name,
          life: 2200,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo actualizar favoritos',
          detail: 'Intenta nuevamente.',
          life: 3000,
        });
      },
    });
  }

  // ── Helpers categoría ────────────────────────────────────
  getCatIcon(category: string): string {
    return (CAT_CFG[category] ?? DEF_CFG).icon;
  }

  getCatColor(category: string): string {
    return (CAT_CFG[category] ?? DEF_CFG).color;
  }

  imageSrc(url: string | null | undefined): string | null {
    return displayImageUrl(url);
  }

  private syncPricesFromRange(): void {
    this.minPrice = this.priceRange[0];
    this.maxPrice = this.priceRange[1];
  }
}
