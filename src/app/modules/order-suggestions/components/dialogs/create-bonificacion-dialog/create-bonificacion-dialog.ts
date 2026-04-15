import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

export interface CreateBonificacionDialogData {
  proveedor_id: number;
  proveedor_nombre: string;
  molecula_id: number;
}

@Component({
  selector: 'app-create-bonificacion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_circle</mat-icon>
      Crear Nueva Bonificación
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="bonificacionForm" class="bonificacion-form">
        <p class="supplier-info">
          <strong>Proveedor:</strong> {{ data.proveedor_nombre }}
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de Bonificación</mat-label>
          <mat-select formControlName="tipo" (selectionChange)="onTipoChange()">
            <mat-option value="PORCENTAJE">
              <mat-icon>percent</mat-icon>
              Porcentaje de Descuento
            </mat-option>
            <mat-option value="DESCUENTO_FIJO">
              <mat-icon>attach_money</mat-icon>
              Descuento Fijo
            </mat-option>
            <mat-option value="UNIDADES_GRATIS">
              <mat-icon>card_giftcard</mat-icon>
              Unidades Gratis (X + Y)
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <input matInput formControlName="descripcion" placeholder="Ej: Promoción de temporada">
          <mat-error *ngIf="bonificacionForm.get('descripcion')?.hasError('required')">
            La descripción es requerida
          </mat-error>
        </mat-form-field>

        <!-- Valor (for PORCENTAJE and DESCUENTO_FIJO) -->
        <mat-form-field appearance="outline" *ngIf="showValorField">
          <mat-label>{{ getValorLabel() }}</mat-label>
          <input matInput type="number" formControlName="valor" min="0">
          <span matPrefix *ngIf="bonificacionForm.get('tipo')?.value === 'DESCUENTO_FIJO'">$</span>
          <span matSuffix *ngIf="bonificacionForm.get('tipo')?.value === 'PORCENTAJE'">%</span>
          <mat-error *ngIf="bonificacionForm.get('valor')?.hasError('required')">
            El valor es requerido
          </mat-error>
        </mat-form-field>

        <!-- Unidades Gratis Fields -->
        <div class="unidades-gratis-section" *ngIf="bonificacionForm.get('tipo')?.value === 'UNIDADES_GRATIS'">
          <mat-form-field appearance="outline">
            <mat-label>Compra</mat-label>
            <input matInput type="number" formControlName="unidades_compradas" min="1">
            <span matSuffix>unidades</span>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lleva</mat-label>
            <input matInput type="number" formControlName="unidades_gratis" min="1">
            <span matSuffix>gratis</span>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Fecha Inicio</mat-label>
          <input matInput [matDatepicker]="pickerInicio" formControlName="fecha_inicio">
          <mat-datepicker-toggle matIconSuffix [for]="pickerInicio"></mat-datepicker-toggle>
          <mat-datepicker #pickerInicio></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha Fin (Opcional)</mat-label>
          <input matInput [matDatepicker]="pickerFin" formControlName="fecha_fin">
          <mat-datepicker-toggle matIconSuffix [for]="pickerFin"></mat-datepicker-toggle>
          <mat-datepicker #pickerFin></mat-datepicker>
          <mat-hint>Dejar vacío para bonificación permanente</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="primary" [disabled]="!bonificacionForm.valid" (click)="onCreate()">
        <mat-icon>save</mat-icon>
        Crear Bonificación
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .bonificacion-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }

    .supplier-info {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .unidades-gratis-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        color: #1976d2;
      }
    }

    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 4px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    mat-option {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `]
})
export class CreateBonificacionDialog {
  bonificacionForm: FormGroup;
  showValorField = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateBonificacionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CreateBonificacionDialogData
  ) {
    this.bonificacionForm = this.fb.group({
      tipo: ['', Validators.required],
      descripcion: ['', Validators.required],
      valor: [0],
      unidades_compradas: [0],
      unidades_gratis: [0],
      fecha_inicio: [new Date(), Validators.required],
      fecha_fin: [null]
    });
  }

  onTipoChange(): void {
    const tipo = this.bonificacionForm.get('tipo')?.value;
    this.showValorField = tipo === 'PORCENTAJE' || tipo === 'DESCUENTO_FIJO';

    // Reset and update validators
    if (tipo === 'UNIDADES_GRATIS') {
      this.bonificacionForm.get('valor')?.clearValidators();
      this.bonificacionForm.get('valor')?.setValue(0);
      this.bonificacionForm.get('unidades_compradas')?.setValidators([Validators.required, Validators.min(1)]);
      this.bonificacionForm.get('unidades_gratis')?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      this.bonificacionForm.get('valor')?.setValidators([Validators.required, Validators.min(0.01)]);
      this.bonificacionForm.get('unidades_compradas')?.clearValidators();
      this.bonificacionForm.get('unidades_gratis')?.clearValidators();
    }

    this.bonificacionForm.get('valor')?.updateValueAndValidity();
    this.bonificacionForm.get('unidades_compradas')?.updateValueAndValidity();
    this.bonificacionForm.get('unidades_gratis')?.updateValueAndValidity();
  }

  getValorLabel(): string {
    const tipo = this.bonificacionForm.get('tipo')?.value;
    return tipo === 'PORCENTAJE' ? 'Porcentaje (%)' : 'Monto ($)';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.bonificacionForm.valid) {
      const formValue = this.bonificacionForm.value;
      const bonificacion = {
        proveedor_id: this.data.proveedor_id,
        proveedor_nombre: this.data.proveedor_nombre,
        molecula_id: this.data.molecula_id,
        tipo: formValue.tipo,
        descripcion: formValue.descripcion,
        valor: formValue.valor,
        unidades_compradas: formValue.unidades_compradas,
        unidades_gratis: formValue.unidades_gratis,
        fecha_inicio: formValue.fecha_inicio,
        fecha_fin: formValue.fecha_fin,
        es_vigente: true
      };
      this.dialogRef.close(bonificacion);
    }
  }
}
