import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from '../services/auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSessionService);
  const token = session.token();

  if (!token) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  }));
};

