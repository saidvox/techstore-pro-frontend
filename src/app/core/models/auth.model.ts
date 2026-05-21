import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  user: User;
}

export interface VerificationRequiredResponse {
  email: string;
  verificationRequired: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface SessionState {
  token: string | null;
  user: User | null;
}
