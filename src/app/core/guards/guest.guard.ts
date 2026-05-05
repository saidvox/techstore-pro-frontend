import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session.service';

export const guestGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  return session.isAuthenticated() ? router.createUrlTree(['/catalogo']) : true;
};

