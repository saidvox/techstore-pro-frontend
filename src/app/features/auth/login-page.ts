import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { AuthStore } from './auth.store';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <section class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-md place-items-center px-4">
      <form class="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm" (ngSubmit)="login()">
        <div class="mb-6">
          <p class="text-sm font-semibold uppercase text-emerald-700">Acceso</p>
          <h1 class="text-3xl font-black tracking-tight">Iniciar sesion</h1>
        </div>

        <div class="grid gap-4">
          <label class="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input pInputText name="email" type="email" autocomplete="email" [(ngModel)]="email" required />
          </label>

          <label class="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <p-password name="password" [(ngModel)]="password" [feedback]="false" [toggleMask]="true" inputStyleClass="w-full" styleClass="w-full" required />
          </label>

          @if (auth.error()) {
            <p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ auth.error() }}</p>
          }

          <p-button type="submit" label="Entrar" icon="pi pi-sign-in" [loading]="auth.loading()" />
          <p-button type="button" label="Entrar con Google" icon="pi pi-google" severity="secondary" [outlined]="true" (onClick)="loginWithGoogle()" />
        </div>

        <p class="mt-5 text-center text-sm text-slate-600">
          No tienes cuenta?
          <a routerLink="/auth/register" class="font-bold text-emerald-700">Registrate</a>
        </p>
      </form>
    </section>
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
    this.auth.login({ email: this.email, password: this.password });
  }

  loginWithGoogle(): void {
    this.auth.loginWithGoogle();
  }
}
