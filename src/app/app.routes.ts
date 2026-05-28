import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login-page').then(m => m.LoginPage),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register-page').then(m => m.RegisterPage),
      },
      {
        path: 'oauth2/success',
        loadComponent: () => import('./features/auth/oauth2-success-page').then(m => m.OAuth2SuccessPage),
      },
      {
        path: 'verificar-email',
        loadComponent: () => import('./features/auth/verify-email-page').then(m => m.VerifyEmailPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home-page').then(m => m.HomePage),
      },
      {
        path: 'catalogo',
        loadComponent: () => import('./features/catalog/catalog-page').then(m => m.CatalogPage),
      },
      {
        path: 'catalogo/:id',
        loadComponent: () => import('./features/catalog/product-detail-page').then(m => m.ProductDetailPage),
      },
      {
        path: 'carrito',
        canActivate: [authGuard],
        loadComponent: () => import('./features/cart/cart-page').then(m => m.CartPage),
      },
      {
        path: 'checkout/mercado-pago/simulacion',
        canActivate: [authGuard],
        loadComponent: () => import('./features/payments/mercado-pago-simulation-page').then(m => m.MercadoPagoSimulationPage),
      },
      {
        path: 'checkout/mercado-pago/retorno',
        canActivate: [authGuard],
        loadComponent: () => import('./features/payments/mercado-pago-return-page').then(m => m.MercadoPagoReturnPage),
      },
      {
        path: 'pedidos',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/orders-page').then(m => m.OrdersPage),
      },
      {
        path: 'favoritos',
        canActivate: [authGuard],
        loadComponent: () => import('./features/favorites/favorites-page').then(m => m.FavoritesPage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-dashboard-page').then(m => m.AdminDashboardPage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found-page').then(m => m.NotFoundPage),
  },
];
