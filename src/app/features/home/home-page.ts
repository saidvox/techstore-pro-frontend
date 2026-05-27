import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SkeletonModule } from 'primeng/skeleton';

import { Product } from '../../core/models/product.model';
import { ProductApiService } from '../../core/services/product-api.service';
import { displayImageUrl } from '../../core/utils/image-url.util';

// ── Configuración de las 3 categorías del carrusel ────────────────────────────
interface CategoryFeature {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
}

const FEATURED_CATEGORIES: CategoryFeature[] = [
  {
    name: 'Laptops',
    icon: 'pi pi-desktop',
    color: '#6C63FF',
    gradient: 'linear-gradient(135deg, rgba(108,99,255,0.18) 0%, rgba(79,70,229,0.04) 100%)',
    description: 'Potencia y portabilidad para trabajo y estudio',
  },
  {
    name: 'Smartphones',
    icon: 'pi pi-mobile',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.04) 100%)',
    description: 'Conectividad y tecnologia en tu bolsillo',
  },
  {
    name: 'Monitores',
    icon: 'pi pi-desktop',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.04) 100%)',
    description: 'Pantallas de alta gama para trabajo y gaming',
  },
];

const HERO_STATS = [
  { icon: 'pi pi-box',    value: '500+', label: 'Productos' },
  { icon: 'pi pi-truck',  value: '24h',  label: 'Despacho rapido' },
  { icon: 'pi pi-shield', value: '100%', label: 'Garantia' },
  { icon: 'pi pi-star',   value: '4.9',  label: 'Valoracion' },
];

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SkeletonModule],
  styles: [`
    .home-hero {
      min-height: calc(100svh - 4rem);
      padding-block: clamp(3.5rem, 7vw, 6rem);
    }
    .home-hero-title {
      font-size: clamp(2.65rem, 7vw, 4.8rem);
      line-height: 0.98;
    }
    .home-hero-copy {
      font-size: clamp(1rem, 2.4vw, 1.25rem);
    }
    .home-hero-actions {
      margin-bottom: clamp(2.5rem, 6vw, 4rem);
    }
    .home-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 640px) {
      .home-stats {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @media (max-width: 480px) {
      .home-hero {
        justify-content: flex-start;
        padding-top: 2.25rem;
      }
      .home-hero-title {
        font-size: clamp(2.25rem, 12vw, 3rem);
      }
      .home-hero-actions {
        margin-bottom: 2rem;
      }
    }
    /* ─── Carrusel infinito ──────────────────────────────── */
    .carousel-viewport {
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
      mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
    }
    .carousel-track {
      display: flex;
      gap: 1.25rem;
      width: max-content;
      animation: carousel-scroll 38s linear infinite;
    }
    .carousel-track:hover {
      animation-play-state: paused;
    }
    .carousel-track.reverse {
      animation-direction: reverse;
      animation-duration: 45s;
    }
    @keyframes carousel-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    /* ─── Tarjeta de carrusel ────────────────────────────── */
    .c-card {
      width: 230px;
      flex-shrink: 0;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
      text-decoration: none;
    }
    .c-card:hover {
      border-color: var(--ts-brand);
      box-shadow: 0 0 32px rgba(108,99,255,0.25);
      transform: translateY(-5px) scale(1.025);
    }
    .c-img {
      width: 100%;
      height: 158px;
      object-fit: contain;
      padding: 14px;
      background: rgba(10,10,30,0.4);
    }
    .c-img-placeholder {
      width: 100%;
      height: 158px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.8rem;
      background: rgba(108,99,255,0.06);
    }
    .c-body { padding: 0.9rem 1rem 1rem; }
    .c-name {
      font-weight: 700;
      font-size: 0.875rem;
      line-height: 1.35;
      color: var(--ts-text);
      margin-bottom: 0.4rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .c-price {
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--ts-brand);
    }
    .c-stock {
      font-size: 0.7rem;
      margin-top: 0.25rem;
      color: var(--ts-text-dim);
    }
    .c-stock.in { color: #10B981; }

    /* ─── Skeleton ───────────────────────────────────────── */
    .skel-card {
      width: 230px;
      height: 260px;
      flex-shrink: 0;
      border-radius: 16px;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      animation: skel-pulse 1.8s ease-in-out infinite;
    }
    @keyframes skel-pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.35; }
    }
  `],
  template: `
  <div class="overflow-x-hidden">

    <!-- ═══════════════════════════════════════════════════
         HERO
    ════════════════════════════════════════════════════ -->
    <section
      class="home-hero relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style="background: var(--ts-gradient-hero);"
    >
      <!-- Orbes decorativos -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style="background: var(--ts-brand); transform: translate(-50%,-50%);"></div>
        <div class="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style="background: var(--ts-accent); transform: translate(50%,50%);"></div>
        <div class="absolute top-3/4 left-1/2 w-48 h-48 rounded-full blur-3xl"
          style="background:#8B5CF6; opacity:0.08; transform:translate(-50%,-50%);"></div>
      </div>
      <!-- Grid decorativo -->
      <div class="absolute inset-0 opacity-5 pointer-events-none"
        style="background-image:linear-gradient(var(--ts-border) 1px,transparent 1px),linear-gradient(90deg,var(--ts-border) 1px,transparent 1px);background-size:60px 60px;"
        aria-hidden="true"></div>

      <div class="relative z-10 max-w-4xl mx-auto ts-fade-up">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
          style="background:rgba(108,99,255,0.15);border:1px solid rgba(108,99,255,0.3);color:var(--ts-brand);">
          <span class="w-2 h-2 rounded-full animate-pulse" style="background:var(--ts-brand);"></span>
          Nueva coleccion disponible
        </div>

        <h1 class="home-hero-title font-black tracking-tight mb-6">
          <span style="color:var(--ts-text);">Tu proximo</span><br>
          <span style="background:var(--ts-gradient-brand);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">dispositivo</span><br>
          <span style="color:var(--ts-text);">te espera</span>
        </h1>

        <p class="home-hero-copy max-w-2xl mx-auto mb-10 leading-relaxed" style="color:var(--ts-text-muted);">
          La mejor seleccion de tecnologia con precios competitivos,
          envio rapido y garantia en todos nuestros productos.
        </p>

        <div class="home-hero-actions flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a routerLink="/catalogo">
            <button class="ts-btn-brand px-8 py-3.5 text-base flex items-center gap-2">
              <i class="pi pi-th-large"></i> Explorar catalogo
            </button>
          </a>
          <a routerLink="/catalogo" [queryParams]="{category:'Laptops'}">
            <button class="px-8 py-3.5 text-base font-bold rounded-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
              style="background:transparent;border:1px solid var(--ts-border-light);color:var(--ts-text);">
              <i class="pi pi-star"></i> Ver ofertas
            </button>
          </a>
        </div>

        <!-- Stats -->
        <div class="home-stats grid gap-4 max-w-2xl mx-auto">
          @for (stat of heroStats; track stat.label) {
            <div class="flex flex-col items-center gap-1 p-3 rounded-xl"
              style="background:rgba(255,255,255,0.03);border:1px solid var(--ts-border);">
              <i [class]="stat.icon + ' text-sm'" style="color:var(--ts-brand);"></i>
              <span class="text-2xl font-black" style="color:var(--ts-text);">{{ stat.value }}</span>
              <span class="text-xs" style="color:var(--ts-text-dim);">{{ stat.label }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span class="text-xs" style="color:var(--ts-text-muted);">Explorar</span>
        <div class="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--ts-border)]"
          style="animation:ts-fade-up 1.5s ease infinite alternate;">
          <i class="pi pi-chevron-down text-xs" style="color:var(--ts-text-muted);"></i>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         CATEGORÍAS DESTACADAS (cards de navegación)
    ════════════════════════════════════════════════════ -->
    <section class="py-20 px-4" style="background:var(--ts-surface-2);">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-12 ts-fade-up">
          <p class="text-sm font-bold uppercase tracking-widest mb-3" style="color:var(--ts-brand);">Categorias</p>
          <h2 class="text-4xl font-black" style="color:var(--ts-text);">Encuentra lo que necesitas</h2>
          <p class="mt-3 text-base max-w-xl mx-auto" style="color:var(--ts-text-muted);">
            Explora nuestra seleccion curada de productos tecnologicos organizados por categoria.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          @for (cat of featuredCategories; track cat.name; let i = $index) {
            <a routerLink="/catalogo" [queryParams]="{category: cat.name}"
              class="group block no-underline" [style.animation-delay]="(i*100)+'ms'">
              <div class="ts-card p-8 flex flex-col gap-5 h-full cursor-pointer"
                [style.background]="cat.gradient">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  [style.background]="cat.color+'22'">
                  <i [class]="cat.icon+' text-2xl'" [style.color]="cat.color"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold mb-2" style="color:var(--ts-text);">{{ cat.name }}</h3>
                  <p class="text-sm leading-relaxed" style="color:var(--ts-text-muted);">{{ cat.description }}</p>
                </div>
                <div class="flex items-center gap-2 text-sm font-bold transition-all duration-200" [style.color]="cat.color">
                  Ver productos <i class="pi pi-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1"></i>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════
         CARRUSELES INFINITOS — 1 por categoría
    ════════════════════════════════════════════════════ -->
    <section class="py-20" style="background:var(--ts-surface);">

      <!-- Skeleton loading -->
      @if (loading()) {
        <div class="space-y-16">
          @for (i of [1,2,3]; track i) {
            <div>
              <div class="max-w-7xl mx-auto px-4 mb-6">
                <div class="w-48 h-7 rounded-lg" style="background:var(--ts-card);animation:skel-pulse 1.8s infinite;"></div>
              </div>
              <div class="flex gap-5 pl-6 overflow-hidden">
                @for (j of [1,2,3,4,5]; track j) { <div class="skel-card"></div> }
              </div>
            </div>
          }
        </div>
      }

      <!-- Error -->
      @if (!loading() && error()) {
        <div class="text-center py-20 px-4">
          <i class="pi pi-exclamation-circle text-5xl mb-4" style="color:var(--ts-text-dim);"></i>
          <p class="font-semibold mb-5" style="color:var(--ts-text-muted);">
            No se pudieron cargar los productos. Verifica que el backend este activo.
          </p>
          <button class="ts-btn-brand px-6 py-3" (click)="loadProducts()">
            <i class="pi pi-refresh mr-2"></i>Reintentar
          </button>
        </div>
      }

      <!-- Carrusel por cada categoría -->
      @if (!loading() && !error()) {
        @for (group of productsByCategory(); track group.category; let gi = $index) {
          <div class="mb-16 ts-fade-up">

            <!-- Header -->
            <div class="max-w-7xl mx-auto px-4 flex items-center justify-between mb-7">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center"
                  [style.background]="getCatColor(group.category)+'22'">
                  <i [class]="getCatIcon(group.category)+' text-lg'" [style.color]="getCatColor(group.category)"></i>
                </div>
                <div>
                  <h2 class="text-2xl font-black leading-none" style="color:var(--ts-text);">{{ group.category }}</h2>
                  <p class="text-xs mt-0.5" style="color:var(--ts-text-muted);">{{ group.products.length }} productos disponibles</p>
                </div>
              </div>
              <a routerLink="/catalogo" [queryParams]="{category: group.category}"
                class="flex items-center gap-1.5 text-sm font-bold no-underline transition-all hover:gap-2.5"
                style="color:var(--ts-brand);">
                Ver todos <i class="pi pi-arrow-right text-xs"></i>
              </a>
            </div>

            <!-- Pista del carrusel -->
            <div class="carousel-viewport">
              <div class="carousel-track" [class.reverse]="gi % 2 !== 0">
                @for (item of carouselItems(group.products); track item._key) {
                  <a class="c-card" [routerLink]="['/catalogo', item.id]">
                    @if (item.imageUrl) {
                      <img [src]="imageSrc(item.imageUrl)" [alt]="item.name" class="c-img" loading="lazy"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                      <div class="c-img-placeholder" style="display:none;">
                        <i [class]="getCatIcon(group.category)" [style.color]="getCatColor(group.category)"></i>
                      </div>
                    } @else {
                      <div class="c-img-placeholder">
                        <i [class]="getCatIcon(group.category)" [style.color]="getCatColor(group.category)"></i>
                      </div>
                    }
                    <div class="c-body">
                      <div class="c-name">{{ item.name }}</div>
                      <div class="c-price">\${{ item.price | number:'1.2-2' }}</div>
                      <div class="c-stock" [class.in]="item.stock > 0">
                        @if (item.stock > 0) {
                          <i class="pi pi-check-circle text-xs mr-1"></i>En stock ({{ item.stock }})
                        } @else {
                          Sin stock
                        }
                      </div>
                    </div>
                  </a>
                }
              </div>
            </div>

          </div>
        }
      }
    </section>

    <!-- ═══════════════════════════════════════════════════
         CTA FINAL
    ════════════════════════════════════════════════════ -->
    <section class="py-24 px-4 relative overflow-hidden" style="background:var(--ts-surface-2);">
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div class="absolute top-0 left-1/3 w-72 h-72 rounded-full opacity-15 blur-3xl" style="background:var(--ts-brand);"></div>
        <div class="absolute bottom-0 right-1/3 w-56 h-56 rounded-full opacity-10 blur-3xl" style="background:var(--ts-accent);"></div>
      </div>
      <div class="relative z-10 max-w-3xl mx-auto text-center ts-fade-up">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style="background:var(--ts-gradient-brand);">
          <i class="pi pi-bolt text-white text-2xl"></i>
        </div>
        <h2 class="text-4xl sm:text-5xl font-black mb-4" style="color:var(--ts-text);">Listo para comprar?</h2>
        <p class="text-lg mb-10" style="color:var(--ts-text-muted);">
          Registrate gratis, explora nuestro catalogo completo y realiza tu primera compra con garantia total.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/auth/register">
            <button class="ts-btn-brand px-8 py-3.5 text-base flex items-center gap-2">
              <i class="pi pi-user-plus"></i> Crear cuenta gratis
            </button>
          </a>
          <a routerLink="/catalogo">
            <button class="px-8 py-3.5 text-base font-bold rounded-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
              style="background:transparent;border:1px solid var(--ts-border-light);color:var(--ts-text);">
              <i class="pi pi-th-large"></i> Ver catalogo completo
            </button>
          </a>
        </div>
        <div class="flex flex-wrap justify-center gap-6 mt-12">
          @for (benefit of benefits; track benefit.label) {
            <div class="flex items-center gap-2 text-sm" style="color:var(--ts-text-muted);">
              <i [class]="benefit.icon" style="color:var(--ts-accent);"></i>
              {{ benefit.label }}
            </div>
          }
        </div>
      </div>
    </section>

  </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly productApi = inject(ProductApiService);
  private readonly destroyRef  = inject(DestroyRef);

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly loading     = signal(true);
  readonly error       = signal<string | null>(null);
  private readonly allProducts = signal<Product[]>([]);

  // ─── Datos estáticos ──────────────────────────────────────────────────────
  readonly heroStats         = HERO_STATS;
  readonly featuredCategories = FEATURED_CATEGORIES;
  readonly benefits = [
    { icon: 'pi pi-shield',  label: 'Garantia en todos los productos' },
    { icon: 'pi pi-truck',   label: 'Despacho en 24 horas' },
    { icon: 'pi pi-refresh', label: 'Devoluciones gratuitas' },
    { icon: 'pi pi-lock',    label: 'Pago 100% seguro' },
  ];

  // ─── Computed ─────────────────────────────────────────────────────────────
  /** Filtra y agrupa los productos por las 3 categorías destacadas. */
  readonly productsByCategory = computed(() => {
    const products   = this.allProducts();
    const categories = FEATURED_CATEGORIES.map(c => c.name);
    return categories
      .map(category => ({
        category,
        products: products.filter(p => p.category === category && p.active),
      }))
      .filter(group => group.products.length > 0);
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productApi.list({ size: 100, page: 0 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  r  => { this.allProducts.set(r.content); this.loading.set(false); },
        error: () => { this.error.set('Error'); this.loading.set(false); },
      });
  }

  /**
   * Duplica los productos para crear el loop visual continuo.
   * Angular trackBy usa `_key` para distinguir originales de duplicados.
   */
  carouselItems(products: Product[]): (Product & { _key: string })[] {
    // Garantizar mínimo de 8 items antes de duplicar
    let pool = [...products];
    while (pool.length < 8) pool = [...pool, ...products];
    // Duplicar para el scroll infinito (translateX -50% vuelve al inicio)
    return [...pool, ...pool].map((p, i) => ({ ...p, _key: `${p.id}-${i}` }));
  }

  getCatIcon(category: string): string {
    return FEATURED_CATEGORIES.find(c => c.name === category)?.icon ?? 'pi pi-box';
  }

  getCatColor(category: string): string {
    return FEATURED_CATEGORIES.find(c => c.name === category)?.color ?? '#6C63FF';
  }

  imageSrc(url: string | null | undefined): string | null {
    return displayImageUrl(url);
  }
}
