import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { Payment } from '../../core/models/payment.model';
import { PaymentApiService } from '../../core/services/payment-api.service';

@Component({
  selector: 'app-mercado-pago-simulation-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, ButtonModule, SkeletonModule],
  styles: [`
    .checkout-wrap { min-height: 100vh; background: var(--ts-surface); display: grid; place-items: center; padding: 2rem 1rem; }
    .mp-shell { width: min(100%, 520px); border-radius: 18px; overflow: hidden; border: 1px solid var(--ts-border); background: var(--ts-card); box-shadow: 0 24px 70px rgba(0,0,0,.24); }
    .mp-head { background: #00b1ea; color: #fff; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .mp-logo { font-weight: 900; letter-spacing: .02em; font-size: 1.2rem; }
    .mp-badge { font-size: .72rem; font-weight: 800; padding: .35rem .65rem; border-radius: 999px; background: rgba(255,255,255,.18); }
    .mp-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .summary { border: 1px solid var(--ts-border); border-radius: 14px; padding: 1rem; background: var(--ts-surface-2); }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .muted { color: var(--ts-text-muted); }
    .amount { font-size: 2rem; font-weight: 900; color: var(--ts-text); }
    .items { display: flex; flex-direction: column; gap: .65rem; }
    .item { display: flex; justify-content: space-between; gap: .75rem; padding-bottom: .65rem; border-bottom: 1px solid var(--ts-border); }
    .item:last-child { border-bottom: 0; padding-bottom: 0; }
    .actions { display: grid; gap: .75rem; }
    .note { font-size: .8rem; line-height: 1.45; color: var(--ts-text-muted); border: 1px dashed var(--ts-border); padding: .75rem; border-radius: 12px; }
  `],
  template: `
    <div class="checkout-wrap">
      <div class="mp-shell">
        <div class="mp-head">
          <div class="mp-logo">Mercado Pago</div>
          <div class="mp-badge">Simulacion</div>
        </div>

        <div class="mp-body">
          @if (loading()) {
            <p-skeleton width="100%" height="90px" borderRadius="14px"></p-skeleton>
            <p-skeleton width="100%" height="180px" borderRadius="14px"></p-skeleton>
          } @else if (payment(); as paymentData) {
            <div>
              <p class="text-xs font-bold uppercase tracking-widest muted">Pedido #{{ paymentData.order.id }}</p>
              <h1 class="text-2xl font-black mt-1" style="color: var(--ts-text);">Confirmar pago</h1>
              <p class="text-sm muted mt-1">Referencia {{ paymentData.externalReference }}</p>
            </div>

            <div class="summary">
              <div class="row">
                <span class="muted font-semibold">Total</span>
                <span class="amount">S/ {{ paymentData.amount | number:'1.2-2' }}</span>
              </div>
              <div class="row mt-2 text-sm">
                <span class="muted">Creado</span>
                <span style="color: var(--ts-text);">{{ paymentData.createdAt | date:'short' }}</span>
              </div>
            </div>

            <div class="items">
              @for (item of paymentData.order.items; track item.productId) {
                <div class="item">
                  <div>
                    <p class="font-bold" style="color: var(--ts-text);">{{ item.productName }}</p>
                    <p class="text-xs muted">{{ item.quantity }} x S/ {{ item.unitPrice | number:'1.2-2' }}</p>
                  </div>
                  <strong style="color: var(--ts-text);">S/ {{ item.subtotal | number:'1.2-2' }}</strong>
                </div>
              }
            </div>

            <div class="note">
              Este checkout no hace cobros reales. Sirve para probar el flujo completo mientras esperas las credenciales de Mercado Pago.
            </div>

            @if (paymentData.status === 'PENDING') {
              <div class="actions">
                <p-button label="Aprobar pago simulado" icon="pi pi-check" severity="success" [loading]="processing()" (onClick)="approve(paymentData.externalReference)" />
                <p-button label="Rechazar pago simulado" icon="pi pi-times" severity="danger" [outlined]="true" [loading]="processing()" (onClick)="reject(paymentData.externalReference)" />
              </div>
            } @else {
              <div class="summary">
                <p class="font-bold" style="color: var(--ts-text);">Pago {{ paymentData.status }}</p>
                <p class="text-sm muted mt-1">{{ paymentData.detail }}</p>
              </div>
              <a routerLink="/pedidos" class="ts-btn-brand px-4 py-3 rounded-xl text-center font-bold no-underline">Ver mis pedidos</a>
            }
          } @else {
            <div class="summary">
              <p class="font-bold" style="color:#EF4444;">No se pudo cargar el pago</p>
              <p class="text-sm muted mt-1">{{ error() }}</p>
            </div>
            <a routerLink="/carrito" class="ts-btn-brand px-4 py-3 rounded-xl text-center font-bold no-underline">Volver al carrito</a>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercadoPagoSimulationPage implements OnInit {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  readonly payment = signal<Payment | null>(null);
  readonly loading = signal(false);
  readonly processing = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const externalReference = this.route.snapshot.queryParamMap.get('externalReference');
    if (!externalReference) {
      this.error.set('La referencia de pago no existe.');
      return;
    }
    this.load(externalReference);
  }

  approve(externalReference: string): void {
    this.processing.set(true);
    this.paymentApi.approveSimulation(externalReference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: payment => {
          this.payment.set(payment);
          this.processing.set(false);
          this.messageService.add({ severity: 'success', summary: 'Pago aprobado', detail: 'Tu pedido fue confirmado.' });
          void this.router.navigateByUrl('/pedidos');
        },
        error: () => {
          this.error.set('No se pudo aprobar el pago simulado.');
          this.processing.set(false);
        },
      });
  }

  reject(externalReference: string): void {
    this.processing.set(true);
    this.paymentApi.rejectSimulation(externalReference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: payment => {
          this.payment.set(payment);
          this.processing.set(false);
          this.messageService.add({ severity: 'warn', summary: 'Pago rechazado', detail: 'El pedido fue cancelado.' });
          void this.router.navigateByUrl('/pedidos');
        },
        error: () => {
          this.error.set('No se pudo rechazar el pago simulado.');
          this.processing.set(false);
        },
      });
  }

  private load(externalReference: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.paymentApi.detail(externalReference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: payment => {
          this.payment.set(payment);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Verifica que el backend este encendido y que la sesion sea la misma que inicio el checkout.');
          this.loading.set(false);
        },
      });
  }
}
