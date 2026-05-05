import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { Product } from '../../core/models/product.model';
import { ProductApiService } from '../../core/services/product-api.service';
import { ProductCard } from '../catalog/components/product-card';

// Configuración de categorías destacadas (máx 3 en home)
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
    gradient: 'linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(79,70,229,0.05) 100%)',
    description: 'Potencia y portabilidad para trabajo y estudio',
  },
  {
    name: 'Smartphones',
    icon: 'pi pi-mobile',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.05) 100%)',
    description: 'Conectividad y tecnologia en tu bolsillo',
  },
  {
    name: 'Accesorios',
    icon: 'pi pi-headphones',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.05) 100%)',
    description: 'Complementa tu setup con los mejores accesorios',
  },
];

// Estadísticas del hero
const HERO_STATS = [
  { icon: 'pi pi-box',     value: '500+', label: 'Productos' },
  { icon: 'pi pi-truck',   value: '24h',  label: 'Despacho rapido' },
  { icon: 'pi pi-shield',  value: '100%', label: 'Garantia' },
  { icon: 'pi pi-star',    value: '4.9',  label: 'Valoracion' },
];

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ButtonModule, SkeletonModule, ProductCard],
  template: `
    <div class="overflow-x-hidden">

      <!-- ═══════════════════════════════════════════════════
           SECCIÓN 1 — HERO
      ════════════════════════════════════════════════════ -->
      <section
        class="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 overflow-hidden"
        style="min-height: 80vh; background: var(--ts-gradient-hero);"
      >
        <!-- Orbes de fondo decorativos -->
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div class="absolute top-1/4 left-1/4 size-96 rounded-full opacity-10 blur-3xl"
            style="background: var(--ts-brand); transform: translate(-50%, -50%);"></div>
          <div class="absolute bottom-1/4 right-1/4 size-72 rounded-full opacity-10 blur-3xl"
            style="background: var(--ts-accent); transform: translate(50%, 50%);"></div>
          <div class="absolute top-3/4 left-1/2 size-48 rounded-full opacity-8 blur-3xl"
            style="background: #8B5CF6; transform: translate(-50%, -50%);"></div>
        </div>

        <!-- Grid decorativo -->
        <div class="absolute inset-0 opacity-5 pointer-events-none"
          style="background-image: linear-gradient(var(--ts-border) 1px, transparent 1px), linear-gradient(90deg, var(--ts-border) 1px, transparent 1px); background-size: 60px 60px;"
          aria-hidden="true"></div>

        <!-- Contenido hero -->
        <div class="relative z-10 max-w-4xl mx-auto ts-fade-up">
          <!-- Badge superior -->
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold"
            style="background: rgba(108,99,255,0.15); border: 1px solid rgba(108,99,255,0.3); color: var(--ts-brand);">
            <span class="size-2 rounded-full animate-pulse" style="background: var(--ts-brand);"></span>
            Nueva coleccion disponible
          </div>

          <!-- Titular principal -->
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
            <span style="color: var(--ts-text);">Tu proximo</span>
            <br>
            <span style="
              background: var(--ts-gradient-brand);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">dispositivo</span>
            <br>
            <span style="color: var(--ts-text);">te espera</span>
          </h1>

          <!-- Subtitulo -->
          <p class="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style="color: var(--ts-text-muted);">
            La mejor seleccion de tecnologia con precios competitivos,
            envio rapido y garantia en todos nuestros productos.
          </p>

          <!-- CTAs -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a routerLink="/catalogo">
              <button class="ts-btn-brand px-8 py-3.5 text-base flex items-center gap-2">
                <i class="pi pi-th-large"></i>
                Explorar catalogo
              </button>
            </a>
            <a routerLink="/catalogo" [queryParams]="{ category: 'Gaming' }">
              <button
                class="px-8 py-3.5 text-base font-bold rounded-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
                style="background: transparent; border: 1px solid var(--ts-border-light); color: var(--ts-text);"
              >
                <i class="pi pi-star"></i>
                Ver ofertas
              </button>
            </a>
          </div>

          <!-- Estadísticas -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            @for (stat of heroStats; track stat.label) {
              <div class="flex flex-col items-center gap-1 p-3 rounded-xl"
                style="background: rgba(255,255,255,0.03); border: 1px solid var(--ts-border);">
                <i [class]="stat.icon + ' text-sm'" style="color: var(--ts-brand);"></i>
                <span class="text-2xl font-black" style="color: var(--ts-text);">{{ stat.value }}</span>
                <span class="text-xs" style="color: var(--ts-text-dim);">{{ stat.label }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Scroll indicator -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span class="text-xs" style="color: var(--ts-text-muted);">Explorar</span>
          <div class="size-8 rounded-full flex items-center justify-center border border-[var(--ts-border)]"
            style="animation: ts-fade-up 1.5s ease infinite alternate;">
            <i class="pi pi-chevron-down text-xs" style="color: var(--ts-text-muted);"></i>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════
           SECCIÓN 2 — CATEGORÍAS DESTACADAS
      ════════════════════════════════════════════════════ -->
      <section class="py-20 px-4" style="background: var(--ts-surface-2);">
        <div class="max-w-7xl mx-auto">

          <!-- Encabezado sección -->
          <div class="text-center mb-12 ts-fade-up">
            <p class="text-sm font-bold uppercase tracking-widest mb-3" style="color: var(--ts-brand);">
              Categorias
            </p>
            <h2 class="text-4xl font-black" style="color: var(--ts-text);">
              Encuentra lo que necesitas
            </h2>
            <p class="mt-3 text-base max-w-xl mx-auto" style="color: var(--ts-text-muted);">
              Explora nuestra seleccion curada de productos tecnologicos organizados por categoria.
            </p>
          </div>

          <!-- Grid de categorías -->
          <div class="grid gap-6 md:grid-cols-3">
            @for (cat of featuredCategories; track cat.name; let i = $index) {
              <a
                routerLink="/catalogo"
                [queryParams]="{ category: cat.name }"
                class="group block no-underline"
                [style.animation-delay]="(i * 100) + 'ms'"
              >
                <div
                  class="ts-card p-8 flex flex-col gap-5 h-full cursor-pointer"
                  [style.background]="cat.gradient"
                >
                  <!-- Ícono -->
                  <div
                    class="size-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    [style.background]="cat.color + '22'"
                  >
                    <i [class]="cat.icon + ' text-2xl'" [style.color]="cat.color"></i>
                  </div>

                  <!-- Texto -->
                  <div class="flex-1">
                    <h3 class="text-xl font-bold mb-2" style="color: var(--ts-text);">
                      {{ cat.name }}
                    </h3>
                    <p class="text-sm leading-relaxed" style="color: var(--ts-text-muted);">
                      {{ cat.description }}
                    </p>
                  </div>

                  <!-- Enlace -->
                  <div class="flex items-center gap-2 text-sm font-bold transition-all duration-200"
                    [style.color]="cat.color">
                    Ver productos
                    <i class="pi pi-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1"></i>
                  </div>
                </div>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════
           SECCIÓN 3 — PRODUCTOS POR CATEGORÍA
      ════════════════════════════════════════════════════ -->
      <section class="py-20 px-4" style="background: var(--ts-surface);">
        <div class="max-w-7xl mx-auto space-y-20">

          @if (loading()) {
            <!-- Skeleton loading -->
            @for (i of [1,2,3]; track i) {
              <div class="space-y-6">
                <p-skeleton height="2rem" width="200px" styleClass="mb-2" />
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  @for (j of [1,2,3,4]; track j) {
                    <p-skeleton height="280px" borderRadius="12px" />
                  }
                </div>
              </div>
            }
          }

          @if (!loading() && error()) {
            <div class="text-center py-12">
              <i class="pi pi-exclamation-circle text-4xl mb-3" style="color: var(--ts-text-dim);"></i>
              <p class="font-semibold" style="color: var(--ts-text-muted);">
                No se pudieron cargar los productos. Verifica que el backend este encendido.
              </p>
              <button class="ts-btn-brand mt-4" (click)="loadProducts()">Reintentar</button>
            </div>
          }

          @for (group of productsByCategory(); track group.category) {
            <div class="ts-fade-up">
              <!-- Header de categoria -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div
                    class="size-10 rounded-xl flex items-center justify-center"
                    [style.background]="getCatColor(group.category) + '22'"
                  >
                    <i [class]="getCatIcon(group.category)" [style.color]="getCatColor(group.category)"></i>
                  </div>
                  <div>
                    <h2 class="text-2xl font-black" style="color: var(--ts-text);">{{ group.category }}</h2>
                    <p class="text-sm" style="color: var(--ts-text-muted);">{{ group.products.length }} productos disponibles</p>
                  </div>
                </div>
                <a
                  routerLink="/catalogo"
                  [queryParams]="{ category: group.category }"
                  class="flex items-center gap-2 text-sm font-bold transition-all hover:gap-3 no-underline"
                  style="color: var(--ts-brand);"
                >
                  Ver todos
                  <i class="pi pi-arrow-right text-xs"></i>
                </a>
              </div>

              <!-- Grid de productos -->
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                @for (product of group.products.slice(0, 4); track product.id) {
                  <app-product-card [product]="product" />
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════
           SECCIÓN 4 — CTA FINAL
      ════════════════════════════════════════════════════ -->
      <section class="py-24 px-4 relative overflow-hidden" style="background: var(--ts-surface-2);">
        <!-- Fondo decorativo -->
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div class="absolute top-0 left-1/3 size-72 rounded-full opacity-15 blur-3xl"
            style="background: var(--ts-brand);"></div>
          <div class="absolute bottom-0 right-1/3 size-56 rounded-full opacity-10 blur-3xl"
            style="background: var(--ts-accent);"></div>
        </div>

        <div class="relative z-10 max-w-3xl mx-auto text-center ts-fade-up">
          <div class="inline-flex items-center justify-center size-16 rounded-2xl mb-6"
            style="background: var(--ts-gradient-brand);">
            <i class="pi pi-bolt text-white text-2xl"></i>
          </div>

          <h2 class="text-4xl sm:text-5xl font-black mb-4" style="color: var(--ts-text);">
            Listo para comprar?
          </h2>
          <p class="text-lg mb-10" style="color: var(--ts-text-muted);">
            Registrate gratis, explora nuestro catalogo completo y realiza tu primera compra con garantia total.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/auth/register">
              <button class="ts-btn-brand px-8 py-3.5 text-base flex items-center gap-2">
                <i class="pi pi-user-plus"></i>
                Crear cuenta gratis
              </button>
            </a>
            <a routerLink="/catalogo">
              <button
                class="px-8 py-3.5 text-base font-bold rounded-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
                style="background: transparent; border: 1px solid var(--ts-border-light); color: var(--ts-text);"
              >
                <i class="pi pi-th-large"></i>
                Ver catalogo completo
              </button>
            </a>
          </div>

          <!-- Garantías -->
          <div class="flex flex-wrap justify-center gap-6 mt-12">
            @for (benefit of benefits; track benefit.label) {
              <div class="flex items-center gap-2 text-sm" style="color: var(--ts-text-muted);">
                <i [class]="benefit.icon" style="color: var(--ts-accent);"></i>
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // ─── Estado ──────────────────────────────────────────────
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly allProducts = signal<Product[]>([]);

  // ─── Datos estáticos ─────────────────────────────────────
  readonly heroStats = HERO_STATS;
  readonly featuredCategories = FEATURED_CATEGORIES;
  readonly benefits = [
    { icon: 'pi pi-shield',     label: 'Garantia en todos los productos' },
    { icon: 'pi pi-truck',      label: 'Despacho en 24 horas' },
    { icon: 'pi pi-refresh',    label: 'Devoluciones gratuitas' },
    { icon: 'pi pi-lock',       label: 'Pago 100% seguro' },
  ];

  // ─── Computed: productos agrupados por categoría ──────────
  readonly productsByCategory = computed(() => {
    const products = this.allProducts();
    const categories = FEATURED_CATEGORIES.map(c => c.name);

    return categories
      .map(category => ({
        category,
        products: products.filter(p => p.category === category && p.active),
      }))
      .filter(group => group.products.length > 0);
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    // Carga los primeros productos de las 3 categorías destacadas
    // Nota: NO enviar el parámetro active — el backend ya filtra solo activos para usuarios públicos.
    // Enviarlo sin ser admin produce un 403 FORBIDDEN.
    this.productApi.list({ size: 50, page: 0 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.allProducts.set(response.content);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los productos.');
          this.loading.set(false);
        },
      });
  }

  getCatIcon(category: string): string {
    const found = FEATURED_CATEGORIES.find(c => c.name === category);
    return found?.icon ?? 'pi pi-box';
  }

  getCatColor(category: string): string {
    const found = FEATURED_CATEGORIES.find(c => c.name === category);
    return found?.color ?? '#6C63FF';
  }
}
