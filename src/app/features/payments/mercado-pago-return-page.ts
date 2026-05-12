import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { Payment } from '../../core/models/payment.model';
import { PaymentApiService } from '../../core/services/payment-api.service';

@Component({
  selector: 'app-mercado-pago-return-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ButtonModule, SkeletonModule],
  styles: [`
    .return-wrap { min-height: 100vh; background: var(--ts-surface); display: grid; place-items: center; padding: 2rem 1rem; }
    .return-card { width: min(100%, 520px); background: var(--ts-card); border: 1px solid var(--ts-border); border-radius: 16px; padding: 1.5rem; }
    .status-icon { width: 3rem; height: 3rem; border-radius: 999px; display: grid; place-items: center; margin-bottom: 1rem; }
    .approved { background: rgba(16,185,129,.16); color: #10B981; }
    .rejected { background: rgba(239,68,68,.16); color: #EF4444; }
    .pending { background: rgba(245,158,11,.16); color: #F59E0B; }
    .muted { color: var(--ts-text-muted); }
    .summary { border: 1px solid var(--ts-border); border-radius: 12px; padding: 1rem; background: var(--ts-surface-2); margin: 1rem 0; }
  `],
  template: `
    <div class="return-wrap">
      <section class="return-card">
        @if (loading()) {
          <p-skeleton width="4rem" height="4rem" borderRadius="999px"></p-skeleton>
          <p-skeleton styleClass="mt-4" width="100%" height="2rem"></p-skeleton>
          <p-skeleton styleClass="mt-3" width="100%" height="8rem" borderRadius="12px"></p-skeleton>
        } @else if (payment(); as data) {
          <div class="status-icon" [class.approved]="data.status === 'APPROVED'" [class.rejected]="data.status === 'REJECTED' || data.status === 'CANCELLED'" [class.pending]="data.status === 'PENDING'">
            <i [class]="statusIcon(data.status)" aria-hidden="true"></i>
          </div>
          <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--ts-brand);">Mercado Pago</p>
          <h1 class="text-2xl font-black mt-1" style="color: var(--ts-text);">{{ statusTitle(data.status) }}</h1>
          <p class="muted mt-2">{{ statusMessage(data.status) }}</p>

          <div class="summary">
            <div class="flex justify-between gap-4">
              <span class="muted">Pedido</span>
              <strong style="color: var(--ts-text);">#{{ data.order.id }}</strong>
            </div>
            <div class="flex justify-between gap-4 mt-2">
              <span class="muted">Total</span>
              <strong style="color: var(--ts-text);">S/ {{ data.amount | number:'1.2-2' }}</strong>
            </div>
            <div class="flex justify-between gap-4 mt-2">
              <span class="muted">Referencia</span>
              <strong class="text-right" style="color: var(--ts-text); overflow-wrap:anywhere;">{{ data.externalReference }}</strong>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <a routerLink="/pedidos" class="ts-btn-brand px-4 py-3 rounded-xl text-center font-bold no-underline">Ver mis pedidos</a>
            <a routerLink="/catalogo" class="px-4 py-3 rounded-xl text-center font-bold no-underline border border-[var(--ts-border)] text-[var(--ts-text)]">Volver al catalogo</a>
          </div>
        } @else {
          <div class="status-icon rejected">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          </div>
          <h1 class="text-2xl font-black" style="color: var(--ts-text);">No se pudo confirmar el pago</h1>
          <p class="muted mt-2">{{ error() }}</p>
          <div class="flex flex-col gap-3 sm:flex-row mt-5">
            <p-button label="Reintentar" icon="pi pi-refresh" (onClick)="sync()" />
            <a routerLink="/pedidos" class="px-4 py-3 rounded-xl text-center font-bold no-underline border border-[var(--ts-border)] text-[var(--ts-text)]">Ver pedidos</a>
          </div>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercadoPagoReturnPage implements OnInit {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly payment = signal<Payment | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.sync();
  }

  sync(): void {
    const externalReference = this.param('external_reference') ?? this.param('externalReference');
    if (!externalReference) {
      this.error.set('Mercado Pago no devolvio la referencia del pago.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.paymentApi.syncMercadoPagoReturn(externalReference, {
      paymentId: this.param('payment_id') ?? this.param('collection_id'),
      status: this.param('status') ?? this.param('collection_status'),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: payment => {
          this.payment.set(payment);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo sincronizar el retorno de Mercado Pago. Verifica que el backend siga encendido y que tu sesion sea la misma.');
          this.loading.set(false);
        },
      });
  }

  statusTitle(status: Payment['status']): string {
    switch (status) {
      case 'APPROVED': return 'Pago aprobado';
      case 'REJECTED': return 'Pago rechazado';
      case 'CANCELLED': return 'Pago cancelado';
      default: return 'Pago pendiente';
    }
  }

  statusMessage(status: Payment['status']): string {
    switch (status) {
      case 'APPROVED': return 'Tu pedido fue confirmado correctamente.';
      case 'REJECTED': return 'Mercado Pago rechazo la operacion de prueba.';
      case 'CANCELLED': return 'La operacion fue cancelada.';
      default: return 'El pago quedo pendiente de confirmacion.';
    }
  }

  statusIcon(status: Payment['status']): string {
    switch (status) {
      case 'APPROVED': return 'pi pi-check';
      case 'REJECTED':
      case 'CANCELLED': return 'pi pi-times';
      default: return 'pi pi-clock';
    }
  }

  private param(name: string): string | null {
    const value = this.route.snapshot.queryParamMap.get(name);
    return value && value !== 'null' ? value : null;
  }
}
