import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, ButtonModule],
  template: `
    <section class="grid min-h-[70vh] place-items-center text-center">
      <div>
        <p class="text-sm font-semibold uppercase text-emerald-700">404</p>
        <h1 class="mt-2 text-3xl font-black tracking-tight">Ruta no encontrada</h1>
        <p class="mt-2 text-slate-500">La pagina solicitada no existe.</p>
        <a routerLink="/catalogo" class="mt-6 inline-block">
          <p-button label="Volver al catalogo" icon="pi pi-arrow-left" />
        </a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}

