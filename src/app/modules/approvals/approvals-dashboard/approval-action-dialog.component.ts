import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface ApprovalActionDialogData {
  action: 'approve' | 'reject' | 'return' | 'approve-all';
  titulo: string;
  mensaje: string;
  comentarioRequerido: boolean;
  labelBtn: string;
  colorBtn?: 'primary' | 'warn' | 'accent';
}

@Component({
  selector: 'app-approval-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="dialog-icon" [ngClass]="iconClass">{{ icon }}</mat-icon>
      {{ data.titulo }}
    </h2>
    <mat-dialog-content>
      <p class="dialog-message" [innerHTML]="data.mensaje"></p>
      <mat-form-field *ngIf="data.action !== 'approve-all'" appearance="outline" class="comentario-field">
        <mat-label>{{ data.comentarioRequerido ? 'Comentario (obligatorio)' : 'Comentario (opcional)' }}</mat-label>
        <textarea matInput [formControl]="comentario" rows="3" placeholder="Ingrese su comentario aquí..."></textarea>
        <mat-hint *ngIf="data.comentarioRequerido">Mínimo 10 caracteres</mat-hint>
        <mat-error *ngIf="comentario.hasError('minlength')">Mínimo 10 caracteres requeridos</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        [color]="data.colorBtn || 'primary'"
        [disabled]="data.comentarioRequerido && (comentario.invalid || (comentario.value?.length ?? 0) < 10)"
        (click)="confirm()">
        {{ data.labelBtn }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { display: flex; align-items: center; gap: 8px; }
    .dialog-icon { font-size: 22px; width: 22px; height: 22px; }
    .icon-warn   { color: #EF4444; }
    .icon-return { color: #F59E0B; }
    .icon-ok     { color: #004AAD; }
    .dialog-message { margin-bottom: 16px; line-height: 1.6; }
    .comentario-field { width: 100%; }
  `],
})
export class ApprovalActionDialogComponent {
  comentario: FormControl;

  get icon(): string {
    if (this.data.action === 'approve' || this.data.action === 'approve-all') return 'check_circle';
    if (this.data.action === 'reject') return 'cancel';
    return 'undo';
  }

  get iconClass(): string {
    if (this.data.action === 'reject') return 'icon-warn';
    if (this.data.action === 'return') return 'icon-return';
    return 'icon-ok';
  }

  constructor(
    public dialogRef: MatDialogRef<ApprovalActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ApprovalActionDialogData,
  ) {
    this.comentario = new FormControl(
      '',
      data.comentarioRequerido ? [Validators.required, Validators.minLength(10)] : [],
    );
  }

  confirm(): void {
    this.dialogRef.close({ comentario: this.comentario.value ?? '' });
  }
}
