import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { AuthStore } from './auth.store';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule],
  styles: [`
    .auth-bg {
      min-height: calc(100vh - 80px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ts-surface);
      padding: 2rem 1rem;
      position: relative;
      overflow: hidden;
    }
    /* Decoración de fondo */
    .auth-bg::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(108,99,255,0.1) 0%, rgba(13,13,28,0) 70%);
      top: -200px;
      left: -200px;
      z-index: 0;
      pointer-events: none;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      background: var(--ts-card);
      border: 1px solid var(--ts-border);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      z-index: 1;
      /* Animación de entrada: deslizar hacia arriba y fade */
      animation: form-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }

    @keyframes form-enter {
      to { opacity: 1; transform: translateY(0); }
    }

    .auth-header { margin-bottom: 2rem; text-align: center; }
    .auth-subtitle {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--ts-brand);
      margin-bottom: 0.5rem;
    }
    .auth-title { font-size: 2rem; font-weight: 900; color: var(--ts-text); }

    .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
    .form-label { font-size: 0.85rem; font-weight: 700; color: var(--ts-text-muted); }
    
    .form-input {
      width: 100%;
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 12px !important;
      color: var(--ts-text) !important;
      padding: 0.75rem 1rem !important;
      font-family: 'Outfit', sans-serif !important;
      font-size: 0.95rem !important;
      transition: all 0.2s;
    }
    .form-input:focus { border-color: var(--ts-brand) !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important; outline: none !important; }
    .form-input::placeholder { color: var(--ts-text-dim) !important; }

    ::ng-deep .ts-pass .p-password-input {
      width: 100% !important;
      background: var(--ts-surface-2) !important;
      border: 1px solid var(--ts-border) !important;
      border-radius: 12px !important;
      color: var(--ts-text) !important;
      padding: 0.75rem 1rem !important;
      font-family: 'Outfit', sans-serif !important;
      font-size: 0.95rem !important;
      transition: all 0.2s;
    }
    ::ng-deep .ts-pass .p-password-input:focus { border-color: var(--ts-brand) !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important; outline: none !important; }
    ::ng-deep .ts-pass .p-icon { color: var(--ts-text-muted) !important; }

    .btn-submit {
      width: 100%;
      padding: 0.85rem;
      border-radius: 12px;
      background: var(--ts-gradient-brand);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s, transform 0.15s;
      margin-top: 1.5rem;
    }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-2px); }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-google {
      width: 100%;
      padding: 0.85rem;
      border-radius: 12px;
      background: var(--ts-surface-2);
      border: 1px solid var(--ts-border);
      color: var(--ts-text);
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      transition: all 0.2s;
      margin-top: 1rem;
    }
    .btn-google:hover { background: var(--ts-surface); border-color: var(--ts-brand); color: var(--ts-brand); }

    .divider-wrap {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.5rem 0;
      color: var(--ts-text-dim);
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .divider-wrap::before, .divider-wrap::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--ts-border);
    }
    .divider-wrap:not(:empty)::before { margin-right: .5em; }
    .divider-wrap:not(:empty)::after { margin-left: .5em; }

    .footer-text { margin-top: 2rem; text-align: center; font-size: 0.9rem; color: var(--ts-text-muted); }
    .footer-link { color: var(--ts-brand); font-weight: 800; text-decoration: none; transition: color 0.2s; }
    .footer-link:hover { color: #8A84FF; text-decoration: underline; }

    .error-box {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #EF4444;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `],
  template: `
    <div class="auth-bg">
      <!-- Botón de regreso -->
      <a routerLink="/" class="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-sm font-bold no-underline transition-all hover:-translate-x-1" style="color: var(--ts-text-muted); z-index: 10;">
        <i class="pi pi-arrow-left"></i> Volver al inicio
      </a>

      <div class="auth-card">
        <div class="auth-header">
          <p class="auth-subtitle">Acceso</p>
          <h1 class="auth-title">Iniciar sesión</h1>
        </div>

        <form (ngSubmit)="login()">
          
          @if (auth.error()) {
            <div class="error-box">
              <i class="pi pi-exclamation-circle"></i>
              {{ auth.error() }}
            </div>
          }

          <div class="form-group">
            <label class="form-label">Correo electrónico</label>
            <input class="form-input" name="email" type="email" placeholder="tu@correo.com" autocomplete="email" [(ngModel)]="email" required />
          </div>

          <div class="form-group ts-pass">
            <label class="form-label">Contraseña</label>
            <p-password name="password" [(ngModel)]="password" [feedback]="false" [toggleMask]="true" placeholder="••••••••" required />
          </div>

          <button type="submit" class="btn-submit" [disabled]="auth.loading()">
            @if (auth.loading()) {
              <i class="pi pi-spinner pi-spin"></i>
            } @else {
              <i class="pi pi-sign-in"></i>
            }
            Entrar
          </button>
        </form>

        <div class="divider-wrap">O continuar con</div>

        <button type="button" class="btn-google" (click)="loginWithGoogle()">
          <i class="pi pi-google"></i>
          Entrar con Google
        </button>

        <p class="footer-text">
          ¿No tienes cuenta?
          <a routerLink="/auth/register" class="footer-link">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthStore);

  email = '';
  password = '';

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    this.auth.setOAuthError(error);
  }

  login(): void {
    if (!this.email || !this.password) return;
    this.auth.login({ email: this.email, password: this.password });
  }

  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
}
