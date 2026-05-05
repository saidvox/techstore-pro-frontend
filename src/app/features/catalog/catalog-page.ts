import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { Product, ProductStockStatus } from '../../core/models/product.model';
import { CatalogStore } from './catalog.store';

interface LazyPageEvent {
  first?: number | null;
  rows?: number | null;
}

@Component({
  selector: 'app-catalog-page',
  imports: [DecimalPipe, FormsModule, ButtonModule, InputTextModule, SelectModule, TableModule, TagModule],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section class="space-y-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">Productos</p>
          <h1 class="text-3xl font-black tracking-tight">Catalogo</h1>
        </div>
        <p-button label="Actualizar" icon="pi pi-refresh" [loading]="store.loading()" (onClick)="store.reload()" />
      </div>

      <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4" (ngSubmit)="applyFilters()">
        <label class="grid gap-2 text-sm font-semibold text-slate-700">
          Buscar
          <input pInputText name="q" type="search" placeholder="Nombre o descripcion" [(ngModel)]="q" />
        </label>
        <label class="grid gap-2 text-sm font-semibold text-slate-700">
          Categoria
          <p-select name="category" [options]="store.categoryOptions()" optionLabel="label" optionValue="value" placeholder="Todas" [showClear]="true" [(ngModel)]="category" />
        </label>
        <label class="grid gap-2 text-sm font-semibold text-slate-700">
          Stock
          <p-select name="stockStatus" [options]="store.stockOptions" optionLabel="label" optionValue="value" placeholder="Cualquier estado" [showClear]="true" [(ngModel)]="stockStatus" />
        </label>
        <div class="flex items-end">
          <p-button type="submit" label="Filtrar" icon="pi pi-filter" class="w-full" styleClass="w-full" />
        </div>
      </form>

      @if (store.error()) {
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {{ store.error() }}
        </div>
      }

      <p-table
        [value]="store.products()"
        [loading]="store.loading()"
        [paginator]="true"
        [rows]="store.size()"
        [first]="store.page() * store.size()"
        [totalRecords]="store.totalElements()"
        [lazy]="true"
        [rowsPerPageOptions]="[5, 10, 20]"
        dataKey="id"
        responsiveLayout="scroll"
        (onLazyLoad)="onPage($event)"
      >
        <ng-template #header>
          <tr>
            <th class="w-24">Imagen</th>
            <th>Producto</th>
            <th>Categoria</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
          </tr>
        </ng-template>

        <ng-template #body let-product>
          <tr>
            <td>
              <img
                class="h-14 w-20 rounded-md border border-slate-200 object-cover"
                [src]="product.imageUrl || fallbackImage"
                [alt]="product.name"
                width="80"
                height="56"
              />
            </td>
            <td>
              <div class="font-bold text-slate-900">{{ product.name }}</div>
              <div class="max-w-xl truncate text-sm text-slate-500">{{ product.description }}</div>
            </td>
            <td>{{ product.category }}</td>
            <td>S/ {{ product.price | number: '1.2-2' }}</td>
            <td>{{ product.stock }}</td>
            <td>
              <p-tag [value]="stockLabel(product)" [severity]="stockSeverity(product)" />
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="6" class="py-8 text-center text-slate-500">
              No se encontraron productos con los filtros actuales.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage implements OnInit {
  readonly store = inject(CatalogStore);
  readonly fallbackImage = 'https://placehold.co/96x72/f8fafc/334155?text=Producto';

  q = '';
  category: string | null = null;
  stockStatus: ProductStockStatus | null = null;

  ngOnInit(): void {
    this.store.loadCategories();
    this.store.load();
  }

  applyFilters(): void {
    this.store.applyFilters({
      q: this.q || undefined,
      category: this.category || undefined,
      stockStatus: this.stockStatus || undefined,
    });
  }

  onPage(event: LazyPageEvent): void {
    const rows = event.rows ?? this.store.size();
    const first = event.first ?? 0;
    this.store.setPage(Math.floor(first / rows), rows);
  }

  stockLabel(product: Product): string {
    if (product.stock === 0) {
      return 'Sin stock';
    }
    if (product.stock <= 5) {
      return 'Stock bajo';
    }
    return 'Disponible';
  }

  stockSeverity(product: Product): 'success' | 'warn' | 'danger' {
    if (product.stock === 0) {
      return 'danger';
    }
    if (product.stock <= 5) {
      return 'warn';
    }
    return 'success';
  }

}
