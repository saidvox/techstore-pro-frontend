import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    .auth-bg {
      min-height: calc(100vh - 80px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ts-surface);
      padding: 2rem 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 430px;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .auth-subtitle {
      color: var(--ts-brand);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .auth-title {
      color: var(--ts-text);
      font-size: 2rem;
      font-weight: 900;
      margin: 0;
    }
    .auth-copy {
      color: var(--ts-text-muted);
      font-size: 0.95rem;
      line-height: 1.55;
      margin: 1rem 0 1.5rem;
    }
    .code-input {
      width: 100%;
      height: 3.25rem;
      border-radius: 12px;
      border: 1px solid var(--ts-border);
      background: var(--ts-surface-2);
      color: var(--ts-text);
      font-family: 'Outfit', sans-serif;
      font-size: 1.45rem;
      font-weight: 900;
      letter-spacing: 0.28em;
      text-align: center;
      outline: none;
    }
    .code-input:focus {
      border-color: var(--ts-brand);
      box-shadow: 0 0 0 3px rgba(108,99,255,0.15);
    }
    .btn-submit, .btn-secondary {
      width: 100%;
      border-radius: 12px;
      border: 0;
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 800;
      padding: 0.85rem;
    }
    .btn-submit {
      background: var(--ts-gradient-brand);
      color: #fff;
      margin-top: 1.25rem;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--ts-border);
      color: var(--ts-text-muted);
      margin-top: 0.75rem;
    }
    .btn-submit:disabled, .btn-secondary:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .notice {
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .notice-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #EF4444;
    }
    .notice-ok {
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.3);
      color: #10B981;
    }
    .footer-link {
      display: block;
      color: var(--ts-brand);
      font-size: 0.9rem;
      font-weight: 800;
      margin-top: 1.5rem;
      text-align: center;
      text-decoration: none;
    }
  `],
  template: `
    <section class="auth-bg">
      <div class="auth-card">
        <p class="auth-subtitle">Verificacion</p>
        <h1 class="auth-title">Confirma tu correo</h1>
        <p class="auth-copy">
          Enviamos un codigo de 6 digitos a <strong>{{ email }}</strong>.
          Ingresa el codigo para activar tu cuenta.
        </p>

        @if (message()) {
          <div class="notice notice-ok">{{ message() }}</div>
        }

        @if (error()) {
          <div class="notice notice-error">{{ error() }}</div>
        }

        <form (ngSubmit)="verify()">
          <input
            class="code-input"
            name="code"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="000000"
            [(ngModel)]="code"
            required
          />
          <button class="btn-submit" type="submit" [disabled]="loading() || code.trim().length !== 6">
            {{ loading() ? 'Validando...' : 'Verificar y entrar' }}
          </button>
        </form>

        <button class="btn-secondary" type="button" [disabled]="loading()" (click)="resend()">
          Reenviar codigo
        </button>

        <a routerLink="/auth/login" class="footer-link">Volver al inicio de sesion</a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly session = inject(AuthSessionService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(this.route.snapshot.queryParamMap.get('message'));

  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  code = '';

  verify(): void {
    if (!this.email || this.code.trim().length !== 6) return;
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.authApi.verifyEmail({ email: this.email, code: this.code.trim() }).subscribe({
      next: response => {
        this.session.setSession(response);
        this.loading.set(false);
        void this.router.navigateByUrl('/catalogo');
      },
      error: error => {
        this.error.set(this.errorMessage(error, 'No se pudo verificar el codigo'));
        this.loading.set(false);
      },
    });
  }

  resend(): void {
    if (!this.email) return;
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.authApi.resendVerification({ email: this.email }).subscribe({
      next: response => {
        this.message.set(response.message);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(this.errorMessage(error, 'No se pudo reenviar el codigo'));
        this.loading.set(false);
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const details = error.error?.details;
      if (Array.isArray(details) && typeof details[0] === 'string') {
        return details[0];
      }
    }
    return fallback;
  }
}
