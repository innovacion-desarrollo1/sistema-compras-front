import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Bonificacion } from '../../../../../core/services/bonificacion.service';

export interface AgregarBonificacionData {
  proveedor_id: number;
  proveedor_nombre: string;
  producto_id: number;
}

@Component({
  selector: 'app-agregar-bonificacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_circle</mat-icon>
      Agregar Bonificación Personalizada
    </h2>

    <mat-dialog-content>
      <form [formGroup]="bonifForm" class="bonif-form">
        
        <!-- Tipo de Bonificación -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Bonificación *</mat-label>
          <mat-select formControlName="tipo" required>
            <mat-option value="PORCENTAJE">
              <mat-icon>percent</mat-icon>
              Descuento Porcentual
            </mat-option>
            <mat-option value="DESCUENTO_FIJO">
              <mat-icon>attach_money</mat-icon>
              Descuento Fijo en Pesos
            </mat-option>
            <mat-option value="UNIDADES_GRATIS">
              <mat-icon>card_giftcard</mat-icon>
              Unidades Gratis (Compra X, Lleva Y)
            </mat-option>
          </mat-select>
          <mat-hint>Seleccione el tipo de bonificación</mat-hint>
        </mat-form-field>

        <!-- Descripción -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción *</mat-label>
          <input 
            matInput 
            formControlName="descripcion"
            placeholder="Ej: Descuento por volumen Q2 2026"
            required>
          <mat-hint>Descripción clara de la bonificación</mat-hint>
          <mat-error *ngIf="bonifForm.get('descripcion')?.hasError('required')">
            La descripción es obligatoria
          </mat-error>
          <mat-error *ngIf="bonifForm.get('descripcion')?.hasError('minlength')">
            Mínimo 5 caracteres
          </mat-error>
        </mat-form-field>

        <!-- Valor (depende del tipo) -->
        <mat-form-field appearance="outline" class="full-width" *ngIf="bonifForm.value.tipo !== 'UNIDADES_GRATIS'">
          <mat-label>{{ getValorLabel() }} *</mat-label>
          <input 
            matInput 
            type="number" 
            formControlName="valor"
            [placeholder]="getValorPlaceholder()"
            required>
          <span matPrefix *ngIf="bonifForm.value.tipo === 'DESCUENTO_FIJO'">\\$&nbsp;</span>
          <span matSuffix *ngIf="bonifForm.value.tipo === 'PORCENTAJE'">%</span>
          <mat-hint>{{ getValorHint() }}</mat-hint>
          <mat-error *ngIf="bonifForm.get('valor')?.hasError('required')">
            El valor es obligatorio
          </mat-error>
          <mat-error *ngIf="bonifForm.get('valor')?.hasError('min')">
            El valor debe ser mayor a 0
          </mat-error>
          <mat-error *ngIf="bonifForm.get('valor')?.hasError('max')">
            El porcentaje no puede ser mayor a 100%
          </mat-error>
        </mat-form-field>

        <!-- Campos para UNIDADES_GRATIS -->
        <div *ngIf="bonifForm.value.tipo === 'UNIDADES_GRATIS'" class="unidades-gratis-section">
          <mat-form-field appearance="outline">
            <mat-label>Unidades a Comprar *</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="unidades_compradas"
              placeholder="Ej: 10"
              required>
            <mat-hint>Cantidad a comprar</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Unidades Gratis *</mat-label>
            <input 
              matInput 
              type="number" 
              formControlName="unidades_gratis"
              placeholder="Ej: 2"
              required>
            <mat-hint>Cantidad gratis</mat-hint>
          </mat-form-field>

          <p class="unidades-example">
            <mat-icon>info</mat-icon>
            <strong>Ejemplo:</strong> Compra {{ bonifForm.value.unidades_compradas || 'X' }}, lleva {{ (bonifForm.value.unidades_compradas || 0) + (bonifForm.value.unidades_gratis || 0) }}
          </p>
        </div>

        <!-- Vigencia -->
        <div class="vigencia-section">
          <mat-form-field appearance="outline">
            <mat-label>Fecha Inicio</mat-label>
            <input 
              matInput 
              [matDatepicker]="pickerInicio" 
              formControlName="fecha_inicio">
            <mat-datepicker-toggle matSuffix [for]="pickerInicio"></mat-datepicker-toggle>
            <mat-datepicker #pickerInicio></mat-datepicker>
            <mat-hint>Por defecto: hoy</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha Fin</mat-label>
            <input 
              matInput 
              [matDatepicker]="pickerFin" 
              formControlName="fecha_fin">
            <mat-datepicker-toggle matSuffix [for]="pickerFin"></mat-datepicker-toggle>
            <mat-datepicker #pickerFin></mat-datepicker>
            <mat-hint>Vacío = permanente</mat-hint>
          </mat-form-field>
        </div>

        <!-- Permanente Checkbox -->
        <mat-checkbox 
          formControlName="es_permanente"
          (change)="onPermanenteChange($event.checked)"
          class="permanente-checkbox">
          Bonificación permanente (sin fecha fin)
        </mat-checkbox>

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
        [disabled]="!bonifForm.valid">
        <mat-icon>add</mat-icon>
        Agregar Bonificación
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .bonif-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .unidades-gratis-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .unidades-example {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background-color: rgba(59, 130, 246, 0.1);
        border-left: 3px solid #3b82f6;
        border-radius: 4px;
        margin: 0;

        mat-icon {
          color: #3b82f6;
        }

        strong {
          color: #1e40af;
        }
      }
    }

    .vigencia-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .permanente-checkbox {
      margin-top: 8px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1e40af;
    }

    mat-dialog-actions {
      padding: 16px 0;
      gap: 8px;
    }

    mat-option {
      mat-icon {
        margin-right: 8px;
        vertical-align: middle;
      }
    }
  `]
})
export class AgregarBonificacionDialog {
  bonifForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AgregarBonificacionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: AgregarBonificacionData
  ) {
    this.bonifForm = this.fb.group({
      tipo: ['PORCENTAJE', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      unidades_compradas: [0],
      unidades_gratis: [0],
      fecha_inicio: [new Date()],
      fecha_fin: [null],
      es_permanente: [false]
    });

    // Validación dinámica según tipo
    this.bonifForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.updateValidators(tipo);
    });
  }

  updateValidators(tipo: string): void {
    const valorControl = this.bonifForm.get('valor');
    const unidadesCompradasControl = this.bonifForm.get('unidades_compradas');
    const unidadesGratisControl = this.bonifForm.get('unidades_gratis');

    if (tipo === 'PORCENTAJE') {
      valorControl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
      unidadesCompradasControl?.clearValidators();
      unidadesGratisControl?.clearValidators();
    } else if (tipo === 'DESCUENTO_FIJO') {
      valorControl?.setValidators([Validators.required, Validators.min(0.01)]);
      unidadesCompradasControl?.clearValidators();
      unidadesGratisControl?.clearValidators();
    } else if (tipo === 'UNIDADES_GRATIS') {
      valorControl?.clearValidators();
      valorControl?.setValue(0);
      unidadesCompradasControl?.setValidators([Validators.required, Validators.min(1)]);
      unidadesGratisControl?.setValidators([Validators.required, Validators.min(1)]);
    }

    valorControl?.updateValueAndValidity();
    unidadesCompradasControl?.updateValueAndValidity();
    unidadesGratisControl?.updateValueAndValidity();
  }

  onPermanenteChange(isPermanente: boolean): void {
    if (isPermanente) {
      this.bonifForm.patchValue({ fecha_fin: null });
      this.bonifForm.get('fecha_fin')?.disable();
    } else {
      this.bonifForm.get('fecha_fin')?.enable();
    }
  }

  getValorLabel(): string {
    const tipo = this.bonifForm.get('tipo')?.value;
    if (tipo === 'PORCENTAJE') return 'Porcentaje de Descuento';
    if (tipo === 'DESCUENTO_FIJO') return 'Monto de Descuento';
    return 'Valor';
  }

  getValorPlaceholder(): string {
    const tipo = this.bonifForm.get('tipo')?.value;
    if (tipo === 'PORCENTAJE') return 'Ej: 15';
    if (tipo === 'DESCUENTO_FIJO') return 'Ej: 500';
    return '';
  }

  getValorHint(): string {
    const tipo = this.bonifForm.get('tipo')?.value;
    if (tipo === 'PORCENTAJE') return 'Porcentaje entre 0.01 y 100';
    if (tipo === 'DESCUENTO_FIJO') return 'Monto en pesos colombianos';
    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.bonifForm.valid) {
      const formValue = this.bonifForm.getRawValue(); // getRawValue incluye campos disabled

      const nuevaBonif: Bonificacion = {
        proveedor_id: this.data.proveedor_id,
        proveedor_nombre: this.data.proveedor_nombre,
        molecula_id: this.data.producto_id,
        tipo: formValue.tipo,
        valor: formValue.tipo === 'UNIDADES_GRATIS' ? 0 : formValue.valor,
        descripcion: formValue.descripcion,
        fecha_inicio: formValue.fecha_inicio,
        fecha_fin: formValue.es_permanente ? null : formValue.fecha_fin,
        es_vigente: true,
        unidades_compradas: formValue.tipo === 'UNIDADES_GRATIS' ? formValue.unidades_compradas : undefined,
        unidades_gratis: formValue.tipo === 'UNIDADES_GRATIS' ? formValue.unidades_gratis : undefined
      };

      this.dialogRef.close(nuevaBonif);
    }
  }
}
