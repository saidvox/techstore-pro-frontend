import { InjectionToken } from '@angular/core';

const productionApiUrl = 'https://api.saidvox.dev';
const localApiUrl = 'http://localhost:8080';

function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return productionApiUrl;
  }

  const { hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  return isLocalhost ? localApiUrl : productionApiUrl;
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: resolveApiBaseUrl,
});
