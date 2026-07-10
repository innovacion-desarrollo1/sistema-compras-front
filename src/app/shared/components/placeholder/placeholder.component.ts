import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                min-height:60vh;gap:16px;color:var(--duana-text-muted);">
      <mat-icon style="font-size:64px;height:64px;width:64px;opacity:0.3;">construction</mat-icon>
      <p style="font-size:1rem;">Módulo en desarrollo</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderComponent {}
