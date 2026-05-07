import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import { CheckoutResponse, Payment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  startMercadoPagoSimulation() {
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/pagos/checkout/mercado-pago/simulacion`, {});
  }

  detail(externalReference: string) {
    return this.http.get<Payment>(`${this.apiUrl}/pagos/${externalReference}`);
  }

  approveSimulation(externalReference: string) {
    return this.http.post<Payment>(`${this.apiUrl}/pagos/simulados/${externalReference}/aprobar`, {});
  }

  rejectSimulation(externalReference: string) {
    return this.http.post<Payment>(`${this.apiUrl}/pagos/simulados/${externalReference}/rechazar`, {});
  }
}
