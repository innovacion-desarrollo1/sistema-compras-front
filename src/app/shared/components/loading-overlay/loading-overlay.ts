import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Reusable Loading Overlay Component
 * Shows a centered spinner with optional message
 * Based on DUANA design system
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-overlay" *ngIf="isLoading">
      <div class="loading-content">
        <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
        <p *ngIf="message" class="loading-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.9);
      z-index: 1000;
      border-radius: 8px;
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .loading-message {
      margin: 0;
      color: #4B5563;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class LoadingOverlay {
  @Input() isLoading: boolean = false;
  @Input() message: string = 'Cargando...';
  @Input() diameter: number = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}
