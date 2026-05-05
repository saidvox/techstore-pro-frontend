import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import { Category } from '../../core/models/category.model';
import { Product, ProductRequest } from '../../core/models/product.model';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ProductApiService } from '../../core/services/product-api.service';
import { SelectOption } from '../../shared/models/select-option.model';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DecimalPipe, FormsModule, ButtonModule, InputNumberModule, InputTextModule, SelectModule, TableModule, TagModule, TextareaModule],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <section class="space-y-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">Administracion</p>
          <h1 class="text-3xl font-black tracking-tight">Panel admin</h1>
        </div>
        <p-button label="Actualizar" icon="pi pi-refresh" [loading]="loading()" (onClick)="reload()" />
      </div>

      @if (message()) {
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {{ message() }}
        </div>
      }
      @if (error()) {
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {{ error() }}
        </div>
      }

      <div class="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div class="space-y-4">
          <form class="rounded-lg border border-slate-200 bg-white p-4" (ngSubmit)="createCategory()">
            <h2 class="text-base font-bold text-slate-900">Nueva categoria</h2>
            <label class="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              Nombre
              <input pInputText name="categoryName" [(ngModel)]="categoryName" required maxlength="80" />
            </label>
            <p-button type="submit" label="Guardar categoria" icon="pi pi-save" class="mt-4 block" styleClass="w-full" [loading]="saving()" />
          </form>

          <form class="rounded-lg border border-slate-200 bg-white p-4" (ngSubmit)="createProduct()">
            <h2 class="text-base font-bold text-slate-900">Nuevo producto</h2>
            <div class="mt-4 grid gap-3">
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Nombre
                <input pInputText name="productName" [(ngModel)]="product.name" required maxlength="120" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Categoria
                <p-select name="productCategory" [options]="categoryOptions()" optionLabel="label" optionValue="value" placeholder="Selecciona" [(ngModel)]="product.categoryId" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                URL de imagen
                <input pInputText name="imageUrl" type="url" [(ngModel)]="product.imageUrl" maxlength="1000" />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Descripcion
                <textarea pTextarea name="description" rows="3" [(ngModel)]="product.description" required maxlength="500"></textarea>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="grid gap-2 text-sm font-semibold text-slate-700">
                  Precio
                  <p-inputnumber name="price" [(ngModel)]="product.price" mode="decimal" [min]="0.01" [minFractionDigits]="2" [maxFractionDigits]="2" />
                </label>
                <label class="grid gap-2 text-sm font-semibold text-slate-700">
                  Stock
                  <p-inputnumber name="stock" [(ngModel)]="product.stock" [min]="0" [showButtons]="true" />
                </label>
              </div>
            </div>
            <p-button type="submit" label="Guardar producto" icon="pi pi-save" class="mt-4 block" styleClass="w-full" [loading]="saving()" />
          </form>
        </div>

        <div class="space-y-4">
          <p-table [value]="products()" [loading]="loading()" dataKey="id" responsiveLayout="scroll">
            <ng-template #header>
              <tr>
                <th class="w-24">Imagen</th>
                <th>Producto</th>
                <th>Categoria</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th class="w-28"></th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr>
                <td>
                  <img class="h-14 w-20 rounded-md border border-slate-200 object-cover" [src]="row.imageUrl || fallbackImage" [alt]="row.name" width="80" height="56" />
                </td>
                <td>
                  <div class="font-bold text-slate-900">{{ row.name }}</div>
                  <div class="max-w-md truncate text-sm text-slate-500">{{ row.description }}</div>
                </td>
                <td>{{ row.category }}</td>
                <td>S/ {{ row.price | number: '1.2-2' }}</td>
                <td>{{ row.stock }}</td>
                <td><p-tag [value]="row.active ? 'Activo' : 'Inactivo'" [severity]="row.active ? 'success' : 'danger'" /></td>
                <td>
                  <p-button icon="pi pi-ban" severity="danger" [rounded]="true" [text]="true" [disabled]="!row.active" (onClick)="deactivateProduct(row)" />
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="py-8 text-center text-slate-500">No hay productos registrados.</td>
              </tr>
            </ng-template>
          </p-table>

          <p-table [value]="categories()" [loading]="loading()" dataKey="id" responsiveLayout="scroll">
            <ng-template #header>
              <tr>
                <th>Categoria</th>
                <th>Estado</th>
                <th class="w-28"></th>
              </tr>
            </ng-template>
            <ng-template #body let-row>
              <tr>
                <td class="font-semibold text-slate-900">{{ row.name }}</td>
                <td><p-tag [value]="row.active ? 'Activa' : 'Inactiva'" [severity]="row.active ? 'success' : 'danger'" /></td>
                <td>
                  <p-button icon="pi pi-ban" severity="danger" [rounded]="true" [text]="true" [disabled]="!row.active" (onClick)="deactivateCategory(row)" />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage implements OnInit {
  private readonly categoryApi = inject(CategoryApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly fallbackImage = 'https://placehold.co/96x72/f8fafc/334155?text=Producto';

  categoryName = '';
  product: ProductRequest = this.emptyProduct();

  ngOnInit(): void {
    this.reload();
  }

  categoryOptions(): SelectOption<number>[] {
    return this.categories()
      .filter(category => category.active)
      .map(category => ({ label: category.name, value: category.id }));
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.categoryApi.list(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: categories => {
          this.categories.set(categories);
          this.loadProducts();
        },
        error: () => {
          this.error.set('No se pudieron cargar las categorias.');
          this.loading.set(false);
        },
      });
  }

  createCategory(): void {
    const name = this.categoryName.trim();
    if (!name) {
      return;
    }
    this.saving.set(true);
    this.clearFeedback();
    this.categoryApi.create({ name, active: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.categoryName = '';
          this.message.set('Categoria creada correctamente.');
          this.saving.set(false);
          this.reload();
        },
        error: () => {
          this.error.set('No se pudo crear la categoria.');
          this.saving.set(false);
        },
      });
  }

  createProduct(): void {
    if (!this.product.name.trim() || !this.product.description.trim() || !this.product.categoryId) {
      this.error.set('Completa nombre, categoria y descripcion.');
      return;
    }
    this.saving.set(true);
    this.clearFeedback();
    this.productApi.create({
      ...this.product,
      name: this.product.name.trim(),
      description: this.product.description.trim(),
      imageUrl: this.product.imageUrl?.trim() || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.product = this.emptyProduct();
          this.message.set('Producto creado correctamente.');
          this.saving.set(false);
          this.loadProducts();
        },
        error: () => {
          this.error.set('No se pudo crear el producto.');
          this.saving.set(false);
        },
      });
  }

  deactivateProduct(product: Product): void {
    this.productApi.delete(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.loadProducts(), error: () => this.error.set('No se pudo desactivar el producto.') });
  }

  deactivateCategory(category: Category): void {
    this.categoryApi.delete(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.reload(), error: () => this.error.set('No se pudo desactivar la categoria.') });
  }

  private loadProducts(): void {
    this.productApi.list({ page: 0, size: 100, includeInactive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.products.set(response.content);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los productos.');
          this.loading.set(false);
        },
      });
  }

  private clearFeedback(): void {
    this.error.set(null);
    this.message.set(null);
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
