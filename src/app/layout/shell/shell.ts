import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { CartStore } from '../../features/cart/cart.store';
import { CartSidebar } from '../cart-sidebar/cart-sidebar';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    ButtonModule, BadgeModule, OverlayBadgeModule,
    CartSidebar,
  ],
  template: `
    <div class="min-h-screen" style="background: var(--ts-surface); color: var(--ts-text);">

      <!-- Header sticky glassmorphism -->
      <header class="sticky top-0 z-30" style="
        background: rgba(15, 15, 26, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--ts-border);
      ">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-3 no-underline group">
            <div class="size-9 rounded-xl flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-110"
              style="background: var(--ts-gradient-brand);">
              T
            </div>
            <span class="font-black text-lg tracking-tight hidden sm:block" style="color: var(--ts-text);">
              Tech<span style="color: var(--ts-brand);">Store</span> Pro
            </span>
          </a>

          <!-- Nav central -->
          <nav class="hidden items-center gap-1 md:flex" aria-label="Navegacion principal">
            <a routerLink="/catalogo" routerLinkActive="nav-active" class="nav-link">
              <i class="pi pi-th-large mr-1.5 text-xs"></i> Catalogo
            </a>
            @if (session.user()) {
              <a routerLink="/pedidos" routerLinkActive="nav-active" class="nav-link">
                <i class="pi pi-receipt mr-1.5 text-xs"></i> Mis pedidos
              </a>
            }
            @if (session.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="nav-active" class="nav-link nav-admin">
                <i class="pi pi-shield mr-1.5 text-xs"></i> Admin
              </a>
            }
          </nav>

          <!-- Acciones derecha -->
          <div class="flex items-center gap-2">

            <!-- Botón carrito con badge -->
            <button
              class="relative size-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style="background: var(--ts-card); border: 1px solid var(--ts-border);"
              (click)="cart.toggleSidebar()"
              aria-label="Abrir carrito"
            >
              <i class="pi pi-shopping-cart" style="color: var(--ts-text);"></i>
              @if (cart.itemCount() > 0) {
                <span class="absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center text-white font-bold"
                  style="font-size: 0.6rem; background: var(--ts-brand);">
                  {{ cart.itemCount() > 9 ? '9+' : cart.itemCount() }}
                </span>
              }
            </button>

            <!-- Usuario logueado -->
            @if (session.user(); as user) {
              <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style="background: var(--ts-card); border: 1px solid var(--ts-border);">
                <div class="size-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style="background: var(--ts-gradient-brand);">
                  {{ user.email[0].toUpperCase() }}
                </div>
                <span class="text-xs font-medium max-w-32 truncate" style="color: var(--ts-text-muted);">
                  {{ user.email }}
                </span>
              </div>
              <button
                class="size-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style="background: var(--ts-card); border: 1px solid var(--ts-border); color: var(--ts-text-muted);"
                (click)="logout()"
                title="Cerrar sesion"
                aria-label="Cerrar sesion"
              >
                <i class="pi pi-sign-out text-sm"></i>
              </button>
            } @else {
              <a routerLink="/auth/login" class="ts-btn-brand text-sm">
                <i class="pi pi-sign-in mr-1.5 text-xs"></i> Entrar
              </a>
            }
          </div>
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="flex-1 w-full flex flex-col">
        <router-outlet />
      </main>

      <!-- Cart Sidebar -->
      <app-cart-sidebar />
    </div>
  `,
  styles: [`
    .nav-link {
      display: flex;
      align-items: center;
      border-radius: 10px;
      color: var(--ts-text-muted);
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.5rem 0.875rem;
      text-decoration: none;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .nav-link:hover {
      background: rgba(108, 99, 255, 0.08);
      color: var(--ts-text);
    }
    .nav-active {
      background: rgba(108, 99, 255, 0.12) !important;
      color: var(--ts-brand) !important;
    }
    .nav-admin {
      color: var(--ts-accent);
    }
    .nav-admin:hover {
      background: rgba(16, 185, 129, 0.08);
      color: var(--ts-accent);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly session = inject(AuthSessionService);
  readonly cart = inject(CartStore);
  private readonly router = inject(Router);

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/auth/login');
  }
}
