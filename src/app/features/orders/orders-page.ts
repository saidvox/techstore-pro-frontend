import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-orders-page',
  imports: [ButtonModule],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <section class="space-y-5">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">Historial</p>
          <h1 class="text-3xl font-black tracking-tight">Pedidos</h1>
        </div>
        <p-button label="Recargar" icon="pi pi-refresh" />
      </div>

      <div class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Aqui conectaremos pedidos paginados, filtros por estado, producto, usuario, fechas y total.
      </div>
    </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {}

