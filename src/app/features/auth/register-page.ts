import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { AuthStore } from './auth.store';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <section class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-md place-items-center px-4">
      <form class="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm" (ngSubmit)="register()">
        <div class="mb-6">
          <p class="text-sm font-semibold uppercase text-emerald-700">Cuenta</p>
          <h1 class="text-3xl font-black tracking-tight">Crear cuenta</h1>
        </div>

        <div class="grid gap-4">
          <label class="grid gap-2 text-sm font-semibold text-slate-700">
            Nombre
            <input pInputText name="name" autocomplete="name" [(ngModel)]="name" required />
          </label>
          <label class="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input pInputText name="email" type="email" autocomplete="email" [(ngModel)]="email" required />
          </label>
          <label class="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <p-password name="password" [(ngModel)]="password" [feedback]="true" [toggleMask]="true" inputStyleClass="w-full" styleClass="w-full" required />
          </label>

          @if (auth.error()) {
            <p class="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ auth.error() }}</p>
          }

          <p-button type="submit" label="Registrarme" icon="pi pi-user-plus" [loading]="auth.loading()" />
          <p-button type="button" label="Registrarme con Google" icon="pi pi-google" severity="secondary" [outlined]="true" (onClick)="registerWithGoogle()" />
        </div>

        <p class="mt-5 text-center text-sm text-slate-600">
          Ya tienes cuenta?
          <a routerLink="/auth/login" class="font-bold text-emerald-700">Inicia sesion</a>
        </p>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  readonly auth = inject(AuthStore);

  name = '';
  email = '';
  password = '';

  register(): void {
    this.auth.register({ name: this.name, email: this.email, password: this.password });
  }

  registerWithGoogle(): void {
    this.auth.registerWithGoogle();
  }
}
