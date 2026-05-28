import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSessionService);
  const token = session.token();

  if (!token || session.isTokenExpired(token)) {
    session.clearIfExpired();
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  })).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403) && session.isTokenExpired(token)) {
        session.clear();
      }

      return throwError(() => error);
    }),
  );
};
