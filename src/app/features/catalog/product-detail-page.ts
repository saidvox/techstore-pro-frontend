import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { Product } from '../../core/models/product.model';
import { ProductApiService } from '../../core/services/product-api.service';
import { CartStore } from '../cart/cart.store';

const CAT_CFG: Record<string, { icon: string; color: string }> = {
  'Laptops':        { icon: 'pi pi-desktop',    color: '#6C63FF' },
  'Smartphones':    { icon: 'pi pi-mobile',     color: '#10B981' },
  'Monitores':      { icon: 'pi pi-desktop',    color: '#F59E0B' },
  'Tablets':        { icon: 'pi pi-tablet',     color: '#3B82F6' },
  'Teclados':       { icon: 'pi pi-keyboard',   color: '#8B5CF6' },
  'Mouse':          { icon: 'pi pi-arrows-alt', color: '#EC4899' },
  'Audifonos':      { icon: 'pi pi-headphones', color: '#14B8A6' },
  'Almacenamiento': { icon: 'pi pi-database',   color: '#F97316' },
  'Componentes':    { icon: 'pi pi-cog',        color: '#EF4444' },
  'Camaras':        { icon: 'pi pi-camera',     color: '#A78BFA' },
  'Impresoras':     { icon: 'pi pi-print',      color: '#34D399' },
};
const DEF_CFG = { icon: 'pi pi-box', color: '#6C63FF' };

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ButtonModule, SkeletonModule],
  styles: [`
    .pdp-wrap { min-height: 100vh; background: var(--ts-surface); padding-bottom: 4rem; }
    
    /* ── Header nav ────────────────────────────────────── */
    .pdp-nav {
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--ts-border);
      background: var(--ts-surface-2);
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--ts-text-muted);
      text-decoration: none;
      transition: color 0.2s, transform 0.2s;
    }
    .back-btn:hover { color: var(--ts-text); transform: translateX(-4px); }

    /* ── Main Layout ─────────────────────────────────────── */
    .pdp-main {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 3rem;
      margin-top: 3rem;
      align-items: start;
    }
    @media(max-width: 900px){ .pdp-main { grid-template-columns: 1fr; gap: 2rem; } }

    /* ── Left Column (Image) ─────────────────────────────── */
    .pdp-img-box {
      background: #0d0d1c;
      border: 1px solid var(--ts-border);
      border-radius: 24px;
      height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .pdp-img { width: 100%; height: 100%; object-fit: contain; padding: 2rem; transition: transform 0.3s; }
    .pdp-img:hover { transform: scale(1.05); }
    .pdp-icon-fallback { font-size: 6rem; opacity: 0.8; }
    
    /* ── Right Column (Info) ─────────────────────────────── */
    .pdp-info { display: flex; flex-direction: column; gap: 1.5rem; }
    
    .pdp-cat-badge {
      align-self: flex-start;
      padding: 0.4rem 0.8rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .pdp-title { font-size: 2.5rem; font-weight: 900; line-height: 1.1; color: var(--ts-text); }
    
    .pdp-price-box { display: flex; align-items: baseline; gap: 1rem; }
    .pdp-price { font-size: 2.5rem; font-weight: 900; color: var(--ts-text); }
    .pdp-price-label { font-size: 0.875rem; font-weight: 600; color: var(--ts-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    
    .pdp-stock-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: var(--ts-surface-2);
      border: 1px solid var(--ts-border);
    }
    
    .pdp-desc { font-size: 1rem; line-height: 1.6; color: var(--ts-text-muted); }
    
    .divider { border: none; border-top: 1px solid var(--ts-border); margin: 0; }
    
    /* Actions */
    .btn-add {
      width: 100%; padding: 1.1rem; border-radius: 14px;
      color: #fff; font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
      transition: all 0.2s; box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    .btn-add:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 15px 25px rgba(0,0,0,0.3); }
    .btn-add:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Related Products ────────────────────────────────── */
    .related-sec { margin-top: 5rem; }
    .related-title { font-size: 1.5rem; font-weight: 800; color: var(--ts-text); margin-bottom: 1.5rem; }
    
    /* Grid de productos pequeños (similar al catálogo pero reutilizando estilos o simplificado) */
    .related-grid {
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
      transition: all 0.25s;
      display: flex;
      flex-direction: column;
      text-decoration: none;
    }
    .p-card:hover { border-color: var(--ts-brand); transform: translateY(-4px); box-shadow: 0 10px 30px rgba(108,99,255,0.15); }
    .p-card-img-wrap {
      height: 160px; background: #0d0d1c; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;
    }
    .p-card-img { width: 100%; height: 100%; object-fit: contain; padding: 16px; transition: transform 0.3s; }
    .p-card:hover .p-card-img { transform: scale(1.06); }
    .p-card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
    .p-card-name { font-weight: 700; font-size: 0.9rem; color: var(--ts-text); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .p-card-price { font-weight: 800; font-size: 1rem; color: var(--ts-text); margin-top: auto; padding-top: 0.5rem; }

    .skel { background: var(--ts-card); border-radius: 16px; animation: skel-pulse 1.8s ease-in-out infinite; }
    @keyframes skel-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  `],
  template: `
    <div class="pdp-wrap">
      
      <!-- Nav Header -->
      <div class="pdp-nav">
        <div class="max-w-7xl mx-auto px-4 sm:px-6">
          <a routerLink="/catalogo" class="back-btn">
            <i class="pi pi-arrow-left"></i> Volver al catálogo
          </a>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        
        <!-- Loading Skeleton -->
        @if (loading()) {
          <div class="pdp-main">
            <div class="skel" style="height: 500px;"></div>
            <div style="display:flex; flex-direction:column; gap: 1.5rem;">
              <div class="skel" style="height: 30px; width: 30%;"></div>
              <div class="skel" style="height: 60px; width: 90%;"></div>
              <div class="skel" style="height: 40px; width: 40%;"></div>
              <div class="skel" style="height: 100px; width: 100%;"></div>
              <div class="skel" style="height: 55px; width: 100%;"></div>
            </div>
          </div>
        }

        <!-- Product Details -->
        @if (!loading() && product(); as p) {
          <div class="pdp-main">
            
            <!-- Izquierda: Imagen -->
            <div class="pdp-img-box">
              @if (p.imageUrl) {
                <img [src]="p.imageUrl" [alt]="p.name" class="pdp-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                <div class="pdp-img-wrap" style="display:none;position:absolute;inset:0;">
                  <i [class]="getCatIcon(p.category) + ' pdp-icon-fallback'" [style.color]="getCatColor(p.category)"></i>
                </div>
              } @else {
                <i [class]="getCatIcon(p.category) + ' pdp-icon-fallback'" [style.color]="getCatColor(p.category)"></i>
              }
            </div>

            <!-- Derecha: Info -->
            <div class="pdp-info">
              
              <!-- Badge Categoría -->
              <div class="pdp-cat-badge" [style.color]="getCatColor(p.category)" [style.background]="getCatColor(p.category) + '1A'">
                <i [class]="getCatIcon(p.category)"></i>
                {{ p.category }}
              </div>

              <!-- Título -->
              <h1 class="pdp-title">{{ p.name }}</h1>
              
              <!-- Precio -->
              <div class="pdp-price-box">
                <span class="pdp-price-label">Precio especial</span>
                <span class="pdp-price">S/ {{ p.price | number:'1.2-2' }}</span>
              </div>

              <hr class="divider">

              <!-- Stock -->
              <div class="pdp-stock-box" 
                   [style.color]="p.stock === 0 ? '#EF4444' : p.stock <= 5 ? '#F59E0B' : '#10B981'"
                   [style.border-color]="p.stock === 0 ? 'rgba(239,68,68,0.3)' : p.stock <= 5 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'">
                <i class="pi" [class.pi-times-circle]="p.stock === 0" [class.pi-exclamation-triangle]="p.stock > 0 && p.stock <= 5" [class.pi-check-circle]="p.stock > 5"></i>
                {{ p.stock === 0 ? 'Agotado temporalmente' : p.stock <= 5 ? '¡Solo quedan ' + p.stock + ' unidades!' : 'Stock disponible (' + p.stock + ')' }}
              </div>

              <!-- Descripción -->
              <p class="pdp-desc">{{ p.description }}</p>

              <!-- Botón Agregar -->
              <button class="btn-add mt-4" 
                      [style.background]="p.stock > 0 ? getCatColor(p.category) : '#3D3D5A'"
                      [disabled]="p.stock === 0"
                      (click)="addToCart(p)">
                <i class="pi pi-shopping-cart text-lg"></i>
                {{ p.stock === 0 ? 'Sin stock' : 'Agregar al carrito' }}
              </button>
              
            </div>
          </div>

          <!-- ── Related Products ── -->
          @if (relatedProducts().length > 0) {
            <div class="related-sec">
              <h2 class="related-title">Te podría interesar</h2>
              <div class="related-grid">
                @for (rp of relatedProducts(); track rp.id) {
                  <a [routerLink]="['/catalogo', rp.id]" class="p-card">
                    <div class="p-card-img-wrap">
                      @if (rp.imageUrl) {
                        <img [src]="rp.imageUrl" [alt]="rp.name" class="p-card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
                        <div class="p-card-img-wrap" style="display:none;position:absolute;inset:0;">
                          <i [class]="getCatIcon(rp.category)" [style.color]="getCatColor(rp.category)" style="font-size:3rem"></i>
                        </div>
                      } @else {
                        <i [class]="getCatIcon(rp.category)" [style.color]="getCatColor(rp.category)" style="font-size:3rem"></i>
                      }
                    </div>
                    <div class="p-card-body">
                      <h3 class="p-card-name">{{ rp.name }}</h3>
                      <p class="p-card-price">S/ {{ rp.price | number:'1.2-2' }}</p>
                    </div>
                  </a>
                }
              </div>
            </div>
          }
        }

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productApi = inject(ProductApiService);
  private readonly cart = inject(CartStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly relatedProducts = signal<Product[]>([]);
  readonly relatedLoading = signal(false);

  ngOnInit(): void {
    // Escuchar cambios en los parámetros de la URL para re-cargar si se hace click en un producto relacionado
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll arriba al cargar uno nuevo

    this.productApi.detail(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        this.loadRelated(p.category, p.id);
      },
      error: () => {
        this.error.set('No se pudo cargar el producto.');
        this.loading.set(false);
        void this.router.navigate(['/catalogo']);
      }
    });
  }

  private loadRelated(category: string, currentId: number): void {
    this.relatedLoading.set(true);
    this.productApi.list({ category, size: 5 }).subscribe({
      next: (res) => {
        // Filtrar el actual y tomar max 4
        const related = res.content.filter(p => p.id !== currentId).slice(0, 4);
        this.relatedProducts.set(related);
        this.relatedLoading.set(false);
      },
      error: () => {
        this.relatedLoading.set(false);
      }
    });
  }

  addToCart(p: Product): void {
    if (p.stock === 0) return;
    this.cart.addProduct(p);
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Agregado al carrito', 
      detail: `${p.name} fue añadido a tu carrito.`, 
      life: 3000 
    });
  }

  getCatIcon(category: string): string {
    return (CAT_CFG[category] ?? DEF_CFG).icon;
  }

  getCatColor(category: string): string {
    return (CAT_CFG[category] ?? DEF_CFG).color;
  }
}
