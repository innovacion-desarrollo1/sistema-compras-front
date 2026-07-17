import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ProveedorItem, ProveedorUpdate } from '../../core/models/proveedor.types';

@Component({
  selector: 'app-edit-proveedor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatIconModule,
  ],
  styles: [`
    .deactivate-warning {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid #F97316;
      background: #FFEDD5;
    }

    .deactivate-warning mat-icon {
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
      color: #9A3412;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .deactivate-warning p {
      margin: 0;
      font-size: 0.875rem;
      color: #9A3412;
      line-height: 1.45;
    }
  `],
  template: `
    <h2 mat-dialog-title>{{ data.nombre || data.nit }}</h2>
    <small style="padding: 0 24px; color: #475569; display: block; margin-top: -8px; margin-bottom: 8px">
      {{ data.nit }}
    </small>

    <mat-dialog-content [formGroup]="form">
      <div style="display: flex; flex-direction: column; gap: 20px; padding: 8px 0; min-width: 360px">

        <mat-slide-toggle formControlName="activo">Activo</mat-slide-toggle>
        <mat-slide-toggle formControlName="vende_a_duana">Vende a DUANA</mat-slide-toggle>
        <mat-slide-toggle formControlName="vende_a_cosmitet">Vende a COSMITET</mat-slide-toggle>

        @if (showDeactivateWarning) {
          <div class="deactivate-warning">
            <mat-icon>warning</mat-icon>
            <p>Este proveedor dejará de recibir sugerencias de compra. Verifique que no tenga órdenes abiertas antes de guardar.</p>
          </div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Monto mínimo (COP)</mat-label>
          <input matInput type="number" formControlName="monto_minimo" min="0" />
          @if (form.get('monto_minimo')?.hasError('min') && form.get('monto_minimo')?.touched) {
            <mat-error>El monto mínimo no puede ser negativo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tiempo de entrega</mat-label>
          <input matInput formControlName="tiempo_entrega" placeholder="Ej: 3-5 días hábiles" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de producto</mat-label>
          <mat-select formControlName="tipo_producto">
            <mat-option value="">— Sin especificar —</mat-option>
            <mat-option value="MEDICAMENTOS">Medicamentos</mat-option>
            <mat-option value="INSUMOS">Insumos</mat-option>
            <mat-option value="MEDICAMENTOS / INSUMOS">Medicamentos / Insumos</mat-option>
          </mat-select>
        </mat-form-field>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ showDeactivateWarning ? 'Guardar y desactivar' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EditProveedorDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  dialogRef  = inject(MatDialogRef<EditProveedorDialogComponent>);

  form!: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ProveedorItem) {}

  get showDeactivateWarning(): boolean {
    return !!this.data.activo && !!this.form && !this.form.get('activo')?.value;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      activo:           [this.data.activo],
      vende_a_duana:    [this.data.vende_a_duana],
      vende_a_cosmitet: [this.data.vende_a_cosmitet],
      monto_minimo:     [this.data.monto_minimo, [Validators.min(0)]],
      tiempo_entrega:   [this.data.tiempo_entrega],
      tipo_producto:    [this.data.tipo_producto ?? ''],
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const patch: ProveedorUpdate = {
      activo:           raw.activo,
      vende_a_duana:    raw.vende_a_duana,
      vende_a_cosmitet: raw.vende_a_cosmitet,
      monto_minimo:     raw.monto_minimo ?? null,
      tiempo_entrega:   raw.tiempo_entrega || null,
      tipo_producto:    raw.tipo_producto  || null,
    };
    this.dialogRef.close(patch);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
