import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '../config/api-url.token';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ResendVerificationRequest,
  VerificationRequiredResponse,
  VerifyEmailRequest,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request);
  }

  register(request: RegisterRequest) {
    return this.http.post<VerificationRequiredResponse>(`${this.apiUrl}/auth/register`, request);
  }

  verifyEmail(request: VerifyEmailRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/verify-email`, request);
  }

  resendVerification(request: ResendVerificationRequest) {
    return this.http.post<VerificationRequiredResponse>(`${this.apiUrl}/auth/resend-verification`, request);
  }

  googleLoginUrl(): string {
    return `${this.apiUrl}/oauth2/authorization/google`;
  }

  googleRegisterUrl(): string {
    return `${this.apiUrl}/oauth2/authorization/google?mode=register`;
  }
}
