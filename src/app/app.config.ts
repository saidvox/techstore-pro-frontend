import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { IMAGE_CONFIG } from '@angular/common';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';

// Activar dark mode de PrimeNG al inicio
document.documentElement.classList.add('dark-mode');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: IMAGE_CONFIG,
      useValue: {
        disableImageSizeWarning: true,
      },
    },
    MessageService,
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    })
  ]
};
