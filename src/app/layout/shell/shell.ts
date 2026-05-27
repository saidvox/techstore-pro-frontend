import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmationService } from 'primeng/api';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { CartStore } from '../../features/cart/cart.store';
import { CartSidebar } from '../cart-sidebar/cart-sidebar';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    ButtonModule, BadgeModule, OverlayBadgeModule, ConfirmDialogModule, DrawerModule,
    CartSidebar,
  ],
  providers: [ConfirmationService],
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
            <button
              class="menu-trigger md:hidden"
              type="button"
              (click)="openMobileMenu()"
              aria-label="Abrir menu"
            >
              <i class="pi pi-bars"></i>
            </button>

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

      <p-drawer
        styleClass="ts-mobile-drawer"
        position="left"
        [visible]="mobileMenuOpen()"
        [modal]="true"
        [dismissible]="true"
        [closeOnEscape]="true"
        (onHide)="closeMobileMenu()"
      >
        <ng-template #header>
          <a routerLink="/" class="drawer-brand no-underline" (click)="closeMobileMenu()">
            <div class="drawer-brand-mark">T</div>
            <span>Tech<span>Store</span> Pro</span>
          </a>
        </ng-template>

        <nav class="drawer-nav" aria-label="Navegacion movil">
          <a routerLink="/catalogo" routerLinkActive="nav-active" class="drawer-nav-link" (click)="closeMobileMenu()">
            <i class="pi pi-th-large"></i>
            <span>Catalogo</span>
          </a>
          @if (session.user()) {
            <a routerLink="/pedidos" routerLinkActive="nav-active" class="drawer-nav-link" (click)="closeMobileMenu()">
              <i class="pi pi-receipt"></i>
              <span>Mis pedidos</span>
            </a>
          }
          @if (session.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="nav-active" class="drawer-nav-link nav-admin" (click)="closeMobileMenu()">
              <i class="pi pi-shield"></i>
              <span>Admin</span>
            </a>
          }
        </nav>

        <ng-template #footer>
          @if (session.user(); as user) {
            <div class="drawer-user">
              <div class="drawer-user-avatar">{{ user.email[0].toUpperCase() }}</div>
              <div class="min-w-0">
                <p>Cuenta activa</p>
                <span>{{ user.email }}</span>
              </div>
            </div>
            <button class="drawer-logout" type="button" (click)="closeMobileMenu(); logout()">
              <i class="pi pi-sign-out"></i>
              Cerrar sesion
            </button>
          } @else {
            <a routerLink="/auth/login" class="drawer-login no-underline" (click)="closeMobileMenu()">
              <i class="pi pi-sign-in"></i>
              Entrar
            </a>
          }
        </ng-template>
      </p-drawer>

      <!-- Contenido principal -->
      <main class="flex-1 w-full flex flex-col">
        <router-outlet />
      </main>

      <!-- Dialog de Confirmación -->
    <p-confirmDialog
      styleClass="ts-confirm-dialog"
      [dismissableMask]="true"
      [closeOnEscape]="true"
    ></p-confirmDialog>

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
    .menu-trigger {
      align-items: center;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 12px;
      color: var(--ts-text);
      display: inline-flex;
      height: 40px;
      justify-content: center;
      transition: border-color 0.2s ease, transform 0.15s ease;
      width: 40px;
    }
    .menu-trigger:hover {
      border-color: var(--ts-brand);
      transform: translateY(-1px);
    }
    ::ng-deep .ts-mobile-drawer .p-drawer {
      background: var(--ts-surface) !important;
      border-right: 1px solid var(--ts-border) !important;
      color: var(--ts-text) !important;
      max-width: min(86vw, 320px) !important;
      width: min(86vw, 320px) !important;
    }
    ::ng-deep .ts-mobile-drawer .p-drawer-header {
      align-items: center !important;
      border-bottom: 1px solid var(--ts-border) !important;
      padding: 1rem !important;
    }
    ::ng-deep .ts-mobile-drawer .p-drawer-content {
      padding: 1rem !important;
    }
    ::ng-deep .ts-mobile-drawer .p-drawer-footer {
      border-top: 1px solid var(--ts-border) !important;
      padding: 1rem !important;
    }
    ::ng-deep .ts-mobile-drawer .p-drawer-close-button {
      color: var(--ts-text-muted) !important;
    }
    .drawer-brand {
      align-items: center;
      color: var(--ts-text);
      display: inline-flex;
      font-size: 1rem;
      font-weight: 900;
      gap: 0.65rem;
    }
    .drawer-brand span span {
      color: var(--ts-brand);
    }
    .drawer-brand-mark {
      align-items: center;
      background: var(--ts-gradient-brand);
      border-radius: 10px;
      color: #fff;
      display: inline-flex;
      font-size: 0.85rem;
      font-weight: 900;
      height: 34px;
      justify-content: center;
      width: 34px;
    }
    .drawer-nav {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .drawer-nav-link,
    .drawer-login,
    .drawer-logout {
      align-items: center;
      background: rgba(255,255,255,0.035);
      border: 1px solid var(--ts-border);
      border-radius: 12px;
      color: var(--ts-text-muted);
      display: flex;
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      font-weight: 800;
      gap: 0.7rem;
      min-height: 46px;
      padding: 0.75rem 0.85rem;
      text-decoration: none;
      width: 100%;
    }
    .drawer-nav-link:hover,
    .drawer-login:hover,
    .drawer-logout:hover {
      border-color: var(--ts-brand);
      color: var(--ts-text);
    }
    .drawer-user {
      align-items: center;
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      min-width: 0;
    }
    .drawer-user-avatar {
      align-items: center;
      background: var(--ts-gradient-brand);
      border-radius: 999px;
      color: #fff;
      display: inline-flex;
      flex: 0 0 auto;
      font-size: 0.8rem;
      font-weight: 900;
      height: 34px;
      justify-content: center;
      width: 34px;
    }
    .drawer-user p {
      color: var(--ts-text);
      font-size: 0.8rem;
      font-weight: 800;
      margin: 0;
    }
    .drawer-user span {
      color: var(--ts-text-muted);
      display: block;
      font-size: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .drawer-login {
      background: var(--ts-gradient-brand);
      border: 0;
      color: #fff;
      justify-content: center;
    }
    .drawer-logout {
      background: transparent;
      cursor: pointer;
      justify-content: center;
    }
    ::ng-deep .ts-confirm-dialog {
      background: var(--ts-card) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 16px !important;
      color: var(--ts-text) !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
      overflow: hidden;
      width: 90vw !important;
      max-width: 420px !important;
    }
    ::ng-deep .ts-confirm-dialog .p-dialog-header {
      padding: 1.5rem 1.5rem 1rem 1.5rem !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      background: transparent !important;
      border: none !important;
    }
    ::ng-deep .ts-confirm-dialog .p-dialog-title {
      font-weight: 800 !important;
      font-size: 1.25rem !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-confirm-dialog .p-dialog-header-icon {
      color: var(--ts-text-muted) !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
      background: transparent !important;
      border: none !important;
      cursor: pointer;
    }
    ::ng-deep .ts-confirm-dialog .p-dialog-header-icon:hover {
      background: var(--ts-surface-2) !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-confirm-dialog .p-dialog-content {
      padding: 0 1.5rem 1.5rem 1.5rem !important;
      display: flex !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      background: transparent !important;
      border: none !important;
      color: var(--ts-text) !important;
    }
    ::ng-deep .ts-confirm-dialog .p-confirm-dialog-icon {
      font-size: 1.5rem !important;
      color: #EF4444 !important;
      margin: 0 !important;
    }
    ::ng-deep .ts-confirm-dialog .p-confirm-dialog-message {
      margin: 0 !important;
      font-size: 0.95rem !important;
      color: var(--ts-text-dim) !important;
      line-height: 1.5 !important;
    }
    ::ng-deep .ts-confirm-dialog .p-dialog-footer {
      padding: 1.25rem 1.5rem !important;
      background: var(--ts-surface-2) !important;
      display: flex !important;
      justify-content: flex-end !important;
      gap: 0.75rem !important;
      border-top: 1px solid var(--ts-border) !important;
    }
    /* Estilos para los botones dentro del dialog */
    ::ng-deep .ts-confirm-dialog .p-confirmdialog-accept-button {
      background: rgba(239, 68, 68, 0.1) !important;
      border: 1px solid rgba(239, 68, 68, 0.3) !important;
      color: #EF4444 !important;
      border-radius: 10px !important;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 700 !important;
      padding: 0.6rem 1.2rem !important;
      transition: all 0.2s !important;
    }
    ::ng-deep .ts-confirm-dialog .p-confirmdialog-accept-button:hover {
      background: rgba(239, 68, 68, 0.2) !important;
    }
    ::ng-deep .ts-confirm-dialog .p-confirmdialog-reject-button {
      background: transparent !important;
      border: 1px solid var(--ts-border) !important;
      color: var(--ts-text-muted) !important;
      border-radius: 10px !important;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 700 !important;
      padding: 0.6rem 1.2rem !important;
      transition: all 0.2s !important;
    }
    ::ng-deep .ts-confirm-dialog .p-confirmdialog-reject-button:hover {
      border-color: var(--ts-text-muted) !important;
      color: var(--ts-text) !important;
    }
    @media (max-width: 480px) {
      ::ng-deep .ts-confirm-dialog .p-dialog-footer {
        flex-direction: column-reverse !important;
      }
      ::ng-deep .ts-confirm-dialog .p-dialog-footer .p-button,
      ::ng-deep .ts-confirm-dialog .p-confirmdialog-accept-button,
      ::ng-deep .ts-confirm-dialog .p-confirmdialog-reject-button {
        justify-content: center !important;
        width: 100% !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  readonly session = inject(AuthSessionService);
  readonly cart = inject(CartStore);
  readonly mobileMenuOpen = signal(false);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.confirmationService.confirm({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas cerrar sesión y volver a la pantalla de inicio?',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Cancelar',
      rejectIcon: 'none',
      acceptIcon: 'none',
      accept: () => {
        this.session.clear();
        void this.router.navigateByUrl('/auth/login');
      }
    });
  }
}
