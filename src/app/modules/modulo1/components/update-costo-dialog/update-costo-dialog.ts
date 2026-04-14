import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface ActualizarCostoData {
  proveedor_id: number;
  proveedor_nombre: string;
  producto_id: number;
  costo_actual: number;
}

@Component({
  selector: 'app-update-costo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Actualizar Precio - {{ data.proveedor_nombre }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="costoForm" class="costo-form">
        <!-- Costo Actual (Read-only) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Costo Actual (Referencia)</mat-label>
          <input 
            matInput 
            type="number" 
            [value]="data.costo_actual" 
            readonly
            class="readonly-input">
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

        <!-- Nuevo Costo -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nuevo Costo *</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="nuevo_costo"
            placeholder="Ingrese el nuevo costo"
            required>
          <span matPrefix>$&nbsp;</span>
          <mat-error *ngIf="costoForm.get('nuevo_costo')?.hasError('required')">
            El costo es obligatorio
          </mat-error>
          <mat-error *ngIf="costoForm.get('nuevo_costo')?.hasError('min')">
            El costo debe ser mayor a 0
          </mat-error>
        </mat-form-field>

        <!-- Delta de Costo (Calculado) -->
        <div class="costo-delta" *ngIf="costoForm.get('nuevo_costo')?.value">
          <div class="delta-card" [ngClass]="getDeltaClass()">
            <mat-icon>{{ getDeltaIcon() }}</mat-icon>
            <div class="delta-info">
              <span class="delta-label">Variación:</span>
              <span class="delta-value">{{ getDeltaPercentage() }}%</span>
              <span class="delta-amount">{{ getDeltaAmount() }}</span>
            </div>
          </div>
        </div>

        <!-- Fecha Efectiva -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha Efectiva</mat-label>
          <input 
            matInput 
            [matDatepicker]="picker" 
            formControlName="fecha_efectiva"
            placeholder="Seleccione fecha">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-hint>Por defecto: hoy</mat-hint>
        </mat-form-field>

        <!-- Motivo del Cambio -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo del Cambio (Opcional)</mat-label>
          <textarea 
            matInput 
            formControlName="motivo"
            rows="3"
            placeholder="Ej: Actualización de lista de precios Q2 2025, Negociación especial, Incremento inflacionario"></textarea>
          <mat-hint>Ayuda a auditoría y trazabilidad</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()"
        [disabled]="!costoForm.valid">
        <mat-icon>save</mat-icon>
        Guardar Nuevo Precio
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .costo-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .readonly-input {
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    .costo-delta {
      margin: 8px 0;
    }

    .delta-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid;
      background-color: rgba(0, 0, 0, 0.02);

      &.increase {
        border-color: #dc2626;
        background-color: rgba(220, 38, 38, 0.1);
        color: #dc2626;
      }

      &.decrease {
        border-color: #16a34a;
        background-color: rgba(22, 163, 74, 0.1);
        color: #16a34a;
      }

      &.neutral {
        border-color: #6b7280;
        background-color: rgba(107, 114, 128, 0.1);
        color: #6b7280;
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .delta-info {
        display: flex;
        flex-direction: column;
        flex: 1;

        .delta-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .delta-value {
          font-size: 18px;
          font-weight: 600;
        }

        .delta-amount {
          font-size: 13px;
          opacity: 0.9;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 0;
      gap: 8px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
  `]
})
export class UpdateCostoDialog {
  costoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UpdateCostoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ActualizarCostoData
  ) {
    this.costoForm = this.fb.group({
      nuevo_costo: [null, [Validators.required, Validators.min(0.01)]],
      fecha_efectiva: [new Date()],
      motivo: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.costoForm.valid) {
      const formValue = this.costoForm.value;
      
      const updateData = {
        proveedor_id: this.data.proveedor_id,
        producto_id: this.data.producto_id,
        nuevo_costo: formValue.nuevo_costo,
        fecha_efectiva: formValue.fecha_efectiva,
        motivo: formValue.motivo,
        costo_anterior: this.data.costo_actual
      };

      this.dialogRef.close(updateData);
      
      this.snackBar.open(
        `Precio actualizado: $${this.data.costo_actual} → $${formValue.nuevo_costo}`,
        'Cerrar',
        { duration: 3000 }
      );
    }
  }

  getDeltaPercentage(): string {
    const nuevo = this.costoForm.get('nuevo_costo')?.value;
    if (!nuevo) return '0';
    
    const delta = ((nuevo - this.data.costo_actual) / this.data.costo_actual) * 100;
    return delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  }

  getDeltaAmount(): string {
    const nuevo = this.costoForm.get('nuevo_costo')?.value;
    if (!nuevo) return '$0';
    
    const delta = nuevo - this.data.costo_actual;
    return delta > 0 ? `+$${delta.toFixed(2)}` : `-$${Math.abs(delta).toFixed(2)}`;
  }

  getDeltaClass(): string {
    const nuevo = this.costoForm.get('nuevo_costo')?.value;
    if (!nuevo || nuevo === this.data.costo_actual) return 'neutral';
    
    return nuevo > this.data.costo_actual ? 'increase' : 'decrease';
  }

  getDeltaIcon(): string {
    const nuevo = this.costoForm.get('nuevo_costo')?.value;
    if (!nuevo || nuevo === this.data.costo_actual) return 'remove';
    
    return nuevo > this.data.costo_actual ? 'trending_up' : 'trending_down';
  }
}
