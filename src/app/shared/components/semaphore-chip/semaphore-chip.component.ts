import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { SemaphoreColor } from '../../utils/semaphore.util';

export type { SemaphoreColor };

@Component({
  selector: 'app-semaphore-chip',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    <span [class]="'semaphore-chip semaphore-chip-' + color" role="status" [attr.aria-label]="label">
      <mat-icon>{{ icon }}</mat-icon>
      {{ label }}
    </span>
  `,
})
export class SemaphoreChipComponent {
  @Input({ required: true }) color!: SemaphoreColor;
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
}
