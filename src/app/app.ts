import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, BadgeModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly count = signal(0);
  readonly isLoading = signal(false);

  readonly countLabel = computed(() =>
    this.count() === 0 ? 'Sin clics aún' : `${this.count()} clic${this.count() === 1 ? '' : 's'}`
  );

  increment(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.count.update(v => v + 1);
      this.isLoading.set(false);
    }, 300);
  }

  reset(): void {
    this.count.set(0);
  }
}
