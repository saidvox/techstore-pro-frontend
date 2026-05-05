import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LoginRequest, RegisterRequest } from '../../core/models/auth.model';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly user = this.session.user;
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly isAdmin = this.session.isAdmin;

  login(request: LoginRequest): void {
    this.loading.set(true);
    this.error.set(null);

    this.authApi.login(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.session.setSession(response);
          this.loading.set(false);
          void this.router.navigateByUrl('/catalogo');
        },
        error: () => {
          this.error.set('Credenciales invalidas');
          this.loading.set(false);
        },
      });
  }

  register(request: RegisterRequest): void {
    this.loading.set(true);
    this.error.set(null);

    this.authApi.register(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.session.setSession(response);
          this.loading.set(false);
          void this.router.navigateByUrl('/catalogo');
        },
        error: () => {
          this.error.set('No se pudo crear la cuenta');
          this.loading.set(false);
        },
      });
  }

  setOAuthError(message: string | null): void {
    this.error.set(message);
  }

  clearError(): void {
    this.error.set(null);
  }

  loginWithGoogle(): void {
    window.location.href = this.authApi.googleLoginUrl();
  }

  registerWithGoogle(): void {
    window.location.href = this.authApi.googleRegisterUrl();
  }

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/auth/login');
  }
}
