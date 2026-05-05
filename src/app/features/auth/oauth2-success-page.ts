import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthSessionService } from '../../core/services/auth-session.service';

@Component({
  selector: 'app-oauth2-success-page',
  imports: [ProgressSpinnerModule],
  template: `
    <section class="grid min-h-screen place-items-center bg-slate-50">
      <div class="grid justify-items-center gap-4 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p-progress-spinner ariaLabel="Validando sesion" />
        <div>
          <h1 class="text-xl font-black">Validando acceso</h1>
          <p class="mt-1 text-sm text-slate-500">Estamos preparando tu sesion de Google.</p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OAuth2SuccessPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    this.session.setOAuthToken(token);
    void this.router.navigateByUrl('/catalogo');
  }
}

