import { computed, Injectable, signal } from '@angular/core';

import { AuthResponse, SessionState } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

const TOKEN_KEY = 'techstore.token';
const USER_KEY = 'techstore.user';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly state = signal<SessionState>(this.readInitialState());

  readonly token = computed(() => this.state().token);
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => Boolean(this.state().token));
  readonly isAdmin = computed(() => this.state().user?.role === 'ADMIN');

  setSession(response: AuthResponse): void {
    this.saveSession(response.token, response.user);
  }

  setOAuthToken(token: string): void {
    this.saveSession(token, this.userFromToken(token));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.state.set({ token: null, user: null });
  }

  private saveSession(token: string, user: User | null): void {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    this.state.set({ token, user });
  }

  private readInitialState(): SessionState {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    return {
      token,
      user: storedUser ? this.parseUser(storedUser) : token ? this.userFromToken(token) : null,
    };
  }

  private parseUser(value: string): User | null {
    try {
      const parsed: unknown = JSON.parse(value);
      if (!this.isUser(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private userFromToken(token: string): User | null {
    const payload = this.decodePayload(token);
    if (!payload) {
      return null;
    }

    const email = this.readString(payload, 'sub');
    const userId = this.readNumber(payload, 'userId');
    const role = this.readString(payload, 'role') as UserRole | null;

    if (!email || !userId || (role !== 'USER' && role !== 'ADMIN')) {
      return null;
    }

    return {
      id: userId,
      name: email.split('@')[0] ?? email,
      email,
      role,
    };
  }

  private decodePayload(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized);
      const parsed: unknown = JSON.parse(json);
      return this.isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private isUser(value: unknown): value is User {
    return this.isRecord(value)
      && typeof value['id'] === 'number'
      && typeof value['name'] === 'string'
      && typeof value['email'] === 'string'
      && (value['role'] === 'USER' || value['role'] === 'ADMIN');
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readString(record: Record<string, unknown>, key: string): string | null {
    const value = record[key];
    return typeof value === 'string' ? value : null;
  }

  private readNumber(record: Record<string, unknown>, key: string): number | null {
    const value = record[key];
    return typeof value === 'number' ? value : null;
  }
}

