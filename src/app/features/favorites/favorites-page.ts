import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { Product } from '../../core/models/product.model';
import { FavoriteApiService } from '../../core/services/favorite-api.service';
import { displayImageUrl } from '../../core/utils/image-url.util';
import { CartStore } from '../cart/cart.store';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ButtonModule, SkeletonModule],
  styles: [`
    .favorites-page { background: var(--ts-surface); min-height: 100vh; padding-bottom: 4rem; }
    .fav-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    }
    .fav-card {
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      text-decoration: none;
      transition: border-color .2s, box-shadow .2s, transform .2s;
    }
    .fav-card:hover {
      border-color: var(--ts-brand);
      box-shadow: 0 18px 38px rgba(108,99,255,.18);
      transform: translateY(-2px);
    }
    .fav-image {
      align-items: center;
      background: #0d0d1c;
      display: flex;
      height: 180px;
      justify-content: center;
      position: relative;
    }
    .fav-image img {
      height: 100%;
      object-fit: contain;
      padding: 1rem;
      width: 100%;
    }
    .offer-badge {
      background: rgba(251,113,133,.16);
      border-radius: 999px;
      color: #fb7185;
      font-size: .65rem;
      font-weight: 900;
      letter-spacing: .04em;
      padding: .18rem .48rem;
      position: absolute;
      right: .75rem;
      text-transform: uppercase;
      top: .75rem;
    }
    .fav-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: .55rem;
      padding: 1rem;
    }
    .fav-category {
      color: var(--ts-brand-light);
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .fav-name {
      color: var(--ts-text);
      font-size: .98rem;
      font-weight: 800;
      line-height: 1.3;
    }
    .fav-desc {
      color: var(--ts-text-dim);
      display: -webkit-box;
      font-size: .78rem;
      line-height: 1.4;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .price-old {
      color: var(--ts-text-muted);
      font-size: .75rem;
      text-decoration: line-through;
    }
    .price-current {
      color: var(--ts-text);
      font-size: 1.1rem;
      font-weight: 900;
    }
    .fav-actions {
      display: grid;
      gap: .5rem;
      grid-template-columns: 1fr auto;
      margin-top: auto;
      padding-top: .5rem;
    }
    .empty-state {
      align-items: center;
      border: 1px solid var(--ts-border);
      border-radius: 18px;
      background: var(--ts-card);
      color: var(--ts-text-muted);
      display: flex;
      flex-direction: column;
      gap: .8rem;
      min-height: 18rem;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    }
    @media (max-width: 640px) {
      .fav-grid { grid-template-columns: 1fr; }
      .fav-image { height: 190px; }
    }
  `],
  template: `
    <div class="favorites-page">
      <div style="background: var(--ts-surface-2); border-bottom: 1px solid var(--ts-border);">
        <div class="max-w-7xl mx-auto px-4 py-5 sm:px-6">
          <p class="text-xs font-bold uppercase tracking-widest mb-1" style="color: var(--ts-brand);">Cliente</p>
          <h1 class="text-3xl font-black" style="color: var(--ts-text);">Mis favoritos</h1>
          <p class="text-sm mt-2" style="color: var(--ts-text-muted);">Productos guardados para revisar ofertas y comprar despues.</p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        @if (loading()) {
          <div class="fav-grid">
            @for (item of [1,2,3,4]; track item) {
              <p-skeleton width="100%" height="320px" borderRadius="16px" />
            }
          </div>
        } @else if (products().length === 0) {
          <div class="empty-state">
            <i class="pi pi-heart text-3xl" style="color: var(--ts-brand);"></i>
            <h2 class="text-xl font-black" style="color: var(--ts-text);">Aun no tienes favoritos</h2>
            <p class="max-w-md">Guarda productos desde el catalogo para recibir recordatorios cuando tengan oferta.</p>
            <a routerLink="/catalogo" class="ts-btn-brand px-5 py-3 rounded-xl no-underline">
              <i class="pi pi-th-large mr-2"></i> Explorar catalogo
            </a>
          </div>
        } @else {
          <div class="fav-grid">
            @for (product of products(); track product.id) {
              <article class="fav-card">
                <a [routerLink]="['/catalogo', product.id]" class="fav-image">
                  @if (product.onOffer) {
                    <span class="offer-badge">-{{ product.discountPercentage }}%</span>
                  }
                  @if (product.imageUrl) {
                    <img [src]="imageSrc(product.imageUrl)" [alt]="product.name" loading="lazy" />
                  } @else {
                    <i class="pi pi-box text-4xl" style="color: var(--ts-brand);"></i>
                  }
                </a>
                <div class="fav-body">
                  <span class="fav-category">{{ product.category }}</span>
                  <a [routerLink]="['/catalogo', product.id]" class="fav-name no-underline">{{ product.name }}</a>
                  <p class="fav-desc">{{ product.description }}</p>
                  <div>
                    @if (product.onOffer) {
                      <div class="price-old">S/ {{ product.price | number:'1.2-2' }}</div>
                    }
                    <div class="price-current">S/ {{ (product.effectivePrice ?? product.price) | number:'1.2-2' }}</div>
                  </div>
                  <div class="fav-actions">
                    <p-button
                      label="Agregar"
                      icon="pi pi-shopping-cart"
                      [disabled]="product.stock === 0"
                      (onClick)="addToCart(product)"
                    />
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      [rounded]="true"
                      [ariaLabel]="'Quitar ' + product.name"
                      (onClick)="remove(product)"
                    />
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage implements OnInit {
  private readonly favoriteApi = inject(FavoriteApiService);
  private readonly cart = inject(CartStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  addToCart(product: Product): void {
    if (product.stock === 0) {
      return;
    }

    this.cart.addProduct(product);
    this.messageService.add({
      severity: 'success',
      summary: 'Agregado al carrito',
      detail: product.name,
      life: 2500,
    });
  }

  remove(product: Product): void {
    this.favoriteApi.remove(product.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.products.update(products => products.filter(item => item.id !== product.id));
          this.messageService.add({
            severity: 'success',
            summary: 'Favorito eliminado',
            detail: product.name,
            life: 2200,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudo eliminar',
            detail: 'Intenta nuevamente.',
            life: 3000,
          });
        },
      });
  }

  imageSrc(url: string | null | undefined): string | null {
    return displayImageUrl(url);
  }

  private load(): void {
    this.loading.set(true);
    this.favoriteApi.list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: products => {
          this.products.set(products.map(product => ({ ...product, favorite: true })));
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'No se pudieron cargar favoritos',
            detail: 'Intenta nuevamente.',
            life: 3000,
          });
        },
      });
  }
}
