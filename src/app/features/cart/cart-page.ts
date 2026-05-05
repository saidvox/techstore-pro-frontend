import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-cart-page',
  imports: [ButtonModule],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <section class="space-y-5">
      <div>
        <p class="text-sm font-semibold uppercase text-emerald-700">Compra</p>
        <h1 class="text-3xl font-black tracking-tight">Carrito</h1>
      </div>

      <div class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Aqui conectaremos el carrito persistente, cantidades, vaciado y confirmacion de pedido.
      </div>
    </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {}

