import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BonificacionService, Bonificacion } from '../../../../../core/services/bonificacion.service';
import { AgregarBonificacionDialog } from '../agregar-bonificacion-dialog/agregar-bonificacion-dialog';

export interface ActualizarCostoData {
  proveedor_id: number;
  proveedor_nombre: string;
  producto_id: number;
  precio_lista_actual: number;  // Cambiado de costo_actual
  bonificaciones_actuales?: Bonificacion[];
  scrollTo?: string;  // Sección para auto-scroll ('bonificaciones', 'precio', etc.)
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
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Actualizar Precio - {{ data.proveedor_nombre }}
    </h2>

    <mat-dialog-content class="precio-dialog-content">
      <form [formGroup]="costoForm">
        
        <!-- SECCIÓN 1: Precio Lista -->
        <mat-card class="section-card precio-lista-section">
          <mat-card-header>
            <div class="section-header">
              <mat-icon>price_check</mat-icon>
              <div>
                <mat-card-title>1. Precio Base del Proveedor</mat-card-title>
                <mat-card-subtitle>Ingrese el precio de lista SIN descuentos ni bonificaciones</mat-card-subtitle>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <!-- Precio Actual Reference -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Precio Lista Actual (Referencia)</mat-label>
              <input 
                matInput 
                type="number" 
                [value]="data.precio_lista_actual" 
                readonly
                class="readonly-input">
              <span matPrefix>\$&nbsp;</span>
            </mat-form-field>

            <!-- Nuevo Precio Lista -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Precio Lista (SIN descuentos) *</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="precio_lista"
                placeholder="Ingrese precio base"
                required>
              <span matPrefix>\$&nbsp;</span>
              <mat-hint>⚠️ IMPORTANTE: Ingrese el precio base ANTES de descuentos</mat-hint>
              <mat-error *ngIf="costoForm.get('precio_lista')?.hasError('required')">
                El precio lista es obligatorio
              </mat-error>
              <mat-error *ngIf="costoForm.get('precio_lista')?.hasError('min')">
                El precio debe ser mayor a 0
              </mat-error>
            </mat-form-field>

            <!-- Visual Example Box -->
            <div class="example-box">
              <mat-icon class="example-icon">lightbulb</mat-icon>
              <div class="example-content">
                <strong>Ejemplo:</strong><br>
                Proveedor cotiza: <strong>\$1,000</strong> con 20% descuento = <strong>\$800</strong> final<br>
                <div class="do-dont">
                  <span class="correct">✅ CORRECTO: Ingrese <strong>\$1,000</strong> aquí</span><br>
                  <span class="incorrect">❌ INCORRECTO: No ingrese \$800</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- SECCIÓN 2: Bonificaciones -->
        <mat-card class="section-card bonif-section">
          <mat-card-header>
            <div class="section-header">
              <mat-icon>discount</mat-icon>
              <div>
                <mat-card-title>2. Bonificaciones y Descuentos</mat-card-title>
                <mat-card-subtitle>Gestione bonificaciones: aplique existentes o cree nuevas personalizadas</mat-card-subtitle>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content id="bonificaciones-section">
            <div class="bonif-list" *ngIf="bonificacionesDisponibles.length > 0">
              <mat-checkbox 
                *ngFor="let bonif of bonificacionesDisponibles"
                [checked]="bonificacionesSeleccionadas.includes(bonif.id!)"
                (change)="toggleBonificacion(bonif.id!, $event.checked)"
                class="bonif-checkbox">
                <div class="bonif-item">
                  <span class="bonif-desc">{{ bonif.descripcion }}</span>
                  <div class="bonif-actions">
                    <mat-chip class="bonif-valor-chip">
                      <mat-icon *ngIf="bonif.tipo === 'PORCENTAJE'">percent</mat-icon>
                      <mat-icon *ngIf="bonif.tipo === 'DESCUENTO_FIJO'">attach_money</mat-icon>
                      <mat-icon *ngIf="bonif.tipo === 'UNIDADES_GRATIS'">card_giftcard</mat-icon>
                      {{ bonif.valor }}{{ bonif.tipo === 'PORCENTAJE' ? '%' : '' }}
                    </mat-chip>
                    <button 
                      mat-icon-button 
                      color="warn"
                      (click)="eliminarBonificacion(bonif.id!); $event.stopPropagation()"
                      matTooltip="Eliminar bonificación"
                      *ngIf="bonif.id && bonif.id < 0">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-checkbox>
            </div>
            <p *ngIf="bonificacionesDisponibles.length === 0" class="no-bonif-message">
              <mat-icon>info</mat-icon>
              No hay bonificaciones activas para este proveedor.
            </p>
            
            <!-- Botón para agregar bonificación personalizada -->
            <button 
              mat-stroked-button 
              type="button"
              color="primary" 
              (click)="agregarBonificacionPersonalizada()"
              class="add-bonif-btn">
              <mat-icon>add_circle</mat-icon>
              Agregar Bonificación Personalizada
            </button>
          </mat-card-content>
        </mat-card>

        <!-- SECCIÓN 3: Precio Neto Calculado -->
        <mat-card class="section-card result-section">
          <mat-card-header>
            <div class="section-header">
              <mat-icon>calculate</mat-icon>
              <div>
                <mat-card-title>3. Precio Neto Final (Calculado Automáticamente)</mat-card-title>
                <mat-card-subtitle>Este es el costo real que pagará DUANA</mat-card-subtitle>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="precio-breakdown">
              <div class="breakdown-line">
                <span class="label">Precio Lista:</span>
                <span class="value">\${{ costoForm.value.precio_lista || 0 | number:'1.0-0' }}</span>
              </div>
              <div class="breakdown-line descuento">
                <span class="label">Bonificaciones/Descuentos:</span>
                <span class="value negative">-\${{ descuentoTotal | number:'1.0-0' }}</span>
              </div>
              <mat-divider></mat-divider>
              <div class="breakdown-line total">
                <span class="label">Precio Neto Real:</span>
                <span class="value highlight">\${{ precioNetoCalculado | number:'1.0-0' }}</span>
              </div>
              
              <!-- Delta vs precio anterior -->
              <div class="delta-section" *ngIf="costoForm.value.precio_lista">
                <div class="delta-card" [ngClass]="getDeltaClass()">
                  <mat-icon>{{ getDeltaIcon() }}</mat-icon>
                  <div class="delta-info">
                    <span class="delta-label">Variación:</span>
                    <span class="delta-value">{{ getDeltaPercentage() }}%</span>
                    <span class="delta-amount">{{ getDeltaAmount() }}</span>
                  </div>
                </div>
              </div>

              <!-- Bonificaciones aplicadas -->
              <div class="bonif-aplicadas" *ngIf="bonificacionesSeleccionadas.length > 0">
                <small>Bonificaciones aplicadas:</small>
                <ul>
                  <li *ngFor="let bonifId of bonificacionesSeleccionadas">
                    {{ getBonificacionById(bonifId)?.descripcion }}
                  </li>
                </ul>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- ALERTA: Caída Sospechosa -->
        <mat-card *ngIf="caidaSospechosa" class="alert-card suspicion-alert">
          <mat-card-content>
            <div class="alert-content">
              <mat-icon class="alert-icon">error</mat-icon>
              <div class="alert-text">
                <strong>{{ mensajeCaidaSospechosa }}</strong>
                <p class="alert-hint">
                  Si está seguro que el precio lista es correcto, explique detalladamente el motivo de la reducción (mínimo 20 caracteres).
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- SECCIÓN 4: Justificación -->
        <mat-card class="section-card audit-section">
          <mat-card-header>
            <div class="section-header">
              <mat-icon>history</mat-icon>
              <div>
                <mat-card-title>4. Justificación del Cambio</mat-card-title>
                <mat-card-subtitle>Obligatorio para auditoría (mínimo 10 caracteres)</mat-card-subtitle>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Motivo del Cambio *</mat-label>
              <textarea 
                matInput 
                formControlName="motivo"
                rows="3"
                required
                [attr.aria-describedby]="caidaSospechosa ? 'motivo-warning' : null"
                placeholder="Ej: Actualización de lista Q2 2026, Renegociación por volumen, Incremento inflacionario, etc."></textarea>
              <mat-hint>Obligatorio para auditoría. Actual: {{ costoForm.get('motivo')?.value?.length || 0 }}/10 caracteres</mat-hint>
              <mat-error *ngIf="costoForm.get('motivo')?.hasError('required')">
                El motivo es obligatorio para auditoría
              </mat-error>
              <mat-error *ngIf="costoForm.get('motivo')?.hasError('minlength')">
                Justificación muy corta. Mínimo 10 caracteres (actual: {{ costoForm.get('motivo')?.value?.length || 0 }})
              </mat-error>
              <mat-hint *ngIf="caidaSospechosa" id="motivo-warning" class="warning-hint">
                ⚠️ Cambio >30%: Justifique claramente por qué el precio baja tanto
              </mat-hint>
            </mat-form-field>

            <!-- Fecha Efectiva -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Fecha Efectiva</mat-label>
              <input 
                matInput 
                [matDatepicker]="picker" 
                formControlName="fecha_efectiva"
                placeholder="Seleccione fecha">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-hint>Por defecto: hoy</mat-hint>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Alertas Bloqueantes -->
        <div *ngIf="alertasBlockeantes.length > 0" class="blocking-alerts">
          <mat-card class="error-card">
            <mat-card-content>
              <div class="error-header">
                <mat-icon>block</mat-icon>
                <strong>No se puede guardar - Corrija los siguientes problemas:</strong>
              </div>
              <ul>
                <li *ngFor="let alerta of alertasBlockeantes">{{ alerta }}</li>
              </ul>
            </mat-card-content>
          </mat-card>
        </div>

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
        [disabled]="!puedeGuardar || isLoading">
        <mat-spinner *ngIf="isLoading" diameter="20" class="button-spinner"></mat-spinner>
        <mat-icon *ngIf="!isLoading">save</mat-icon>
        {{ isLoading ? 'Guardando...' : 'Guardar Precio' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* ===== DIALOG CONTAINER ===== */
    :host {
      display: block;
      max-height: 90vh;
    }

    .precio-dialog-content {
      max-height: calc(90vh - 200px);
      overflow-y: auto;
      padding: 24px;  /* Aumentado de 16px a 24px */
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 16px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
    }

    /* ===== FORM LAYOUT ===== */
    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 480px;  /* Reducido de 600px */
      max-width: 650px;  /* Reducido de 800px */
      padding: 8px;  /* Padding interno del form */
    }

    .full-width {
      width: 100%;
    }

    /* ===== SECTION CARDS ===== */
    .section-card {
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #3b82f6;
      padding: 4px;  /* Padding adicional en la card */

      &.precio-lista-section {
        border-left-color: #3b82f6;
      }

      &.bonif-section {
        border-left-color: #10b981;
      }

      &.result-section {
        border-left-color: #8b5cf6;
      }

      &.audit-section {
        border-left-color: #f59e0b;
      }

      .section-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        mat-icon {
          color: #1e40af;
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        div {
          flex: 1;
        }
      }

      mat-card-header {
        margin-bottom: 16px;
      }

      mat-card-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      mat-card-subtitle {
        font-size: 13px;
        color: #6b7280;
      }
    }

    /* ===== PRECIO LISTA INPUT ===== */
    .readonly-input {
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
      background-color: rgba(0, 0, 0, 0.02);
    }

    mat-form-field ::ng-deep {
      .mat-mdc-form-field-hint {
        color: #f59e0b;
        font-weight: 500;
      }
    }

    /* ===== VISUAL EXAMPLE BOX ===== */
    .example-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
      border: 2px solid #3b82f6;
      border-radius: 8px;
      margin-top: 12px;

      .example-icon {
        color: #1e40af;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .example-content {
        flex: 1;
        font-size: 13px;
        line-height: 1.5;

        strong {
          color: #1e40af;
        }

        .do-dont {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .correct {
            color: #16a34a;
            font-weight: 500;
          }

          .incorrect {
            color: #dc2626;
            font-weight: 500;
          }
        }
      }
    }

    /* ===== BONIFICACIONES CHECKBOXES ===== */
    .bonif-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .bonif-checkbox {
        width: 100%;

        .bonif-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          background-color: rgba(0, 0, 0, 0.02);
          transition: background-color 0.2s;

          &:hover {
            background-color: rgba(0, 0, 0, 0.04);
          }

          .bonif-desc {
            flex: 1;
            font-size: 14px;
            color: #374151;
          }

          .bonif-actions {
            display: flex;
            align-items: center;
            gap: 8px;

            .bonif-valor-chip {
              background-color: #10b981;
              color: white;
              font-weight: 500;
              padding: 4px 8px;

              mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
                margin-right: 4px;
              }
            }

            button[mat-icon-button] {
              width: 32px;
              height: 32px;
              line-height: 32px;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
              }
            }
          }
        }
      }
    }

    .no-bonif-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 6px;
      color: #6b7280;
      font-size: 13px;

      mat-icon {
        color: #3b82f6;
      }
    }

    /* ===== BOTÓN AGREGAR BONIFICACIÓN ===== */
    .add-bonif-btn {
      width: 100%;
      margin-top: 16px;
      border: 2px dashed #10b981;
      color: #10b981;
      font-weight: 500;
      padding: 12px;

      mat-icon {
        color: #10b981;
        margin-right: 8px;
      }

      &:hover {
        background-color: rgba(16, 185, 129, 0.1);
        border-color: #059669;
      }
    }

    /* ===== PRECIO BREAKDOWN ===== */
    .precio-breakdown {
      padding: 16px;
      background-color: rgba(139, 92, 246, 0.05);
      border-radius: 8px;

      .breakdown-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;

        .label {
          font-size: 14px;
          color: #6b7280;
        }

        .value {
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;

          &.negative {
            color: #10b981;
          }

          &.highlight {
            font-size: 20px;
            font-weight: 700;
            color: #8b5cf6;
          }
        }

        &.total {
          margin-top: 8px;
          padding-top: 12px;
        }
      }

      mat-divider {
        margin: 12px 0;
      }

      /* Delta Section */
      .delta-section {
        margin-top: 16px;
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

      /* Bonificaciones aplicadas */
      .bonif-aplicadas {
        margin-top: 16px;
        padding: 12px;
        background-color: rgba(16, 185, 129, 0.1);
        border-radius: 6px;

        small {
          font-weight: 600;
          color: #10b981;
        }

        ul {
          margin: 8px 0 0 0;
          padding-left: 20px;

          li {
            font-size: 12px;
            color: #374151;
            margin-bottom: 4px;
          }
        }
      }
    }

    /* ===== ALERTAS ===== */
    .alert-card {
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      &.suspicion-alert {
        border-left: 5px solid #dc2626;
        background-color: rgba(220, 38, 38, 0.05);

        .alert-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          .alert-icon {
            color: #dc2626;
            font-size: 32px;
            width: 32px;
            height: 32px;
          }

          .alert-text {
            flex: 1;

            strong {
              color: #dc2626;
              font-size: 15px;
            }

            .alert-hint {
              margin-top: 8px;
              font-size: 13px;
              color: #6b7280;
            }
          }
        }
      }
    }

    /* ===== ALERTAS BLOQUEANTES ===== */
    .blocking-alerts {
      margin: 16px 0;

      .error-card {
        border-left: 5px solid #dc2626;
        background-color: rgba(220, 38, 38, 0.1);

        .error-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #dc2626;
          margin-bottom: 12px;

          mat-icon {
            font-size: 28px;
            width: 28px;
            height: 28px;
          }

          strong {
            font-size: 15px;
          }
        }

        ul {
          margin: 0;
          padding-left: 40px;

          li {
            color: #dc2626;
            font-size: 13px;
            margin-bottom: 6px;
            font-weight: 500;
          }
        }
      }
    }

    /* ===== WARNING HINT ===== */
    .warning-hint {
      color: #f59e0b !important;
      font-weight: 600;
    }

    /* ===== DIALOG ACTIONS ===== */
    mat-dialog-actions {
      padding: 16px;
      gap: 8px;
      background-color: rgba(0, 0, 0, 0.02);
      border-top: 1px solid rgba(0, 0, 0, 0.1);

      button {
        mat-icon {
          margin-right: 4px;
        }

        &[color="primary"] {
          position: relative;

          .button-spinner {
            position: absolute;
            left: 12px;
          }
        }
      }
    }

    /* ===== HIGHLIGHT SECTION (auto-scroll) ===== */
    :host ::ng-deep .highlight-section {
      animation: highlight-pulse 2s ease-in-out;
    }

    @keyframes highlight-pulse {
      0%, 100% {
        background-color: transparent;
      }
      50% {
        background-color: rgba(59, 130, 246, 0.1);
      }
    }

    /* ===== RESPONSIVENESS ===== */
    @media (max-width: 768px) {
      form {
        min-width: 100%;
      }

      .precio-dialog-content {
        padding: 8px;
      }

      .example-box {
        flex-direction: column;

        .example-icon {
          font-size: 24px;
        }
      }
    }
  `]
})
export class UpdateCostoDialog implements OnInit {
  costoForm: FormGroup;
  bonificacionesDisponibles: Bonificacion[] = [];
  bonificacionesSeleccionadas: number[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private bonificacionService: BonificacionService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<UpdateCostoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ActualizarCostoData
  ) {
    this.costoForm = this.fb.group({
      precio_lista: [null, [Validators.required, Validators.min(0.01)]],
      fecha_efectiva: [new Date()],
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Cargar bonificaciones vigentes del proveedor para este producto específico
    this.bonificacionService.getBonificaciones().subscribe((bonificaciones: Bonificacion[]) => {
      // Filtrar bonificaciones vigentes para este proveedor Y producto
      this.bonificacionesDisponibles = bonificaciones.filter((b: Bonificacion) => 
        b.proveedor_id === this.data.proveedor_id &&
        b.molecula_id === this.data.producto_id &&
        b.es_vigente
      );
      
      console.log('[Update Precio] Bonificaciones disponibles para proveedor', this.data.proveedor_id, 'producto', this.data.producto_id, ':', this.bonificacionesDisponibles);
      
      // Pre-seleccionar bonificaciones actuales si las hay
      if (this.data.bonificaciones_actuales) {
        this.bonificacionesSeleccionadas = this.data.bonificaciones_actuales
          .map(b => b.id!)
          .filter(id => id !== undefined);
      }
    });

    // Auto-scroll a sección específica si se especificó
    if (this.data.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(`${this.data.scrollTo}-section`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Highlight temporal
          element.classList.add('highlight-section');
          setTimeout(() => element.classList.remove('highlight-section'), 2000);
        }
      }, 300);
    }
  }

  // ==================== GETTERS PARA CÁLCULOS ====================

  get descuentoTotal(): number {
    const precioLista = this.costoForm.get('precio_lista')?.value || 0;
    let totalDescuento = 0;

    this.bonificacionesSeleccionadas.forEach(bonifId => {
      const bonif = this.getBonificacionById(bonifId);
      if (bonif) {
        if (bonif.tipo === 'PORCENTAJE') {
          totalDescuento += precioLista * (bonif.valor / 100);
        } else if (bonif.tipo === 'DESCUENTO_FIJO') {
          totalDescuento += bonif.valor;
        }
        // UNIDADES_GRATIS no afecta el precio unitario directamente
      }
    });

    return totalDescuento;
  }

  get precioNetoCalculado(): number {
    const precioLista = this.costoForm.get('precio_lista')?.value || 0;
    return Math.max(0, precioLista - this.descuentoTotal);
  }

  get caidaSospechosa(): boolean {
    const precioLista = this.costoForm.get('precio_lista')?.value;
    if (!precioLista || precioLista <= 0) return false;

    const delta = ((this.data.precio_lista_actual - precioLista) / this.data.precio_lista_actual) * 100;
    return delta > 30; // Caída mayor al 30%
  }

  get mensajeCaidaSospechosa(): string {
    const precioLista = this.costoForm.get('precio_lista')?.value;
    if (!precioLista) return '';

    const delta = ((this.data.precio_lista_actual - precioLista) / this.data.precio_lista_actual) * 100;
    return `⚠️ Alerta: El precio lista bajó ${delta.toFixed(1)}% (>30%). ¿Ingresó un precio con descuentos ya aplicados?`;
  }

  get alertasBlockeantes(): string[] {
    const alertas: string[] = [];

    // Validar que el formulario sea válido
    if (this.costoForm.get('precio_lista')?.invalid) {
      alertas.push('El precio lista es obligatorio y debe ser mayor a 0');
    }

    const motivo = this.costoForm.get('motivo')?.value || '';
    if (motivo.length < 10) {
      alertas.push(`Justificación insuficiente (${motivo.length}/10 caracteres mínimos)`);
    }

    // Si hay caída sospechosa, exigir justificación más larga
    if (this.caidaSospechosa && motivo.length < 20) {
      alertas.push('Para cambios >30%, justifique con al menos 20 caracteres');
    }

    return alertas;
  }

  get puedeGuardar(): boolean {
    return this.costoForm.valid && this.alertasBlockeantes.length === 0;
  }

  // ==================== MÉTODOS DE BONIFICACIONES ====================

  // Agregar bonificación personalizada con diálogo nested
  agregarBonificacionPersonalizada(): void {
    const dialogRef = this.dialog.open(AgregarBonificacionDialog, {
      width: '550px',
      data: {
        proveedor_id: this.data.proveedor_id,
        proveedor_nombre: this.data.proveedor_nombre,
        producto_id: this.data.producto_id
      }
    });

    dialogRef.afterClosed().subscribe((nuevaBonif: Bonificacion | null) => {
      if (nuevaBonif) {
        // Agregar a la lista de disponibles con ID temporal
        const tempId = -(this.bonificacionesDisponibles.length + 1); // ID temporal negativo
        nuevaBonif.id = tempId;
        this.bonificacionesDisponibles.push(nuevaBonif);
        
        // Auto-seleccionar la nueva bonificación
        this.bonificacionesSeleccionadas.push(tempId);
        
        this.snackBar.open(
          `Bonificación agregada: ${nuevaBonif.descripcion}`,
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  toggleBonificacion(bonifId: number, selected: boolean): void {
    if (selected) {
      if (!this.bonificacionesSeleccionadas.includes(bonifId)) {
        this.bonificacionesSeleccionadas.push(bonifId);
      }
    } else {
      const index = this.bonificacionesSeleccionadas.indexOf(bonifId);
      if (index > -1) {
        this.bonificacionesSeleccionadas.splice(index, 1);
      }
    }
  }

  getBonificacionById(bonifId: number): Bonificacion | undefined {
    return this.bonificacionesDisponibles.find(b => b.id === bonifId);
  }

  eliminarBonificacion(bonifId: number): void {
    // Deseleccionar si estaba seleccionada
    const index = this.bonificacionesSeleccionadas.indexOf(bonifId);
    if (index > -1) {
      this.bonificacionesSeleccionadas.splice(index, 1);
    }

    // Eliminar de la lista de disponibles (solo para bonificaciones temporales con ID negativo)
    const bonifIndex = this.bonificacionesDisponibles.findIndex(b => b.id === bonifId);
    if (bonifIndex > -1) {
      const bonif = this.bonificacionesDisponibles[bonifIndex];
      this.bonificacionesDisponibles.splice(bonifIndex, 1);
      
      this.snackBar.open(
        `Bonificación "${bonif.descripcion}" eliminada`,
        'Cerrar',
        { duration: 2000 }
      );
    }
  }

  // ==================== MÉTODOS DE DELTA ====================

  getDeltaPercentage(): string {
    const precioLista = this.costoForm.get('precio_lista')?.value;
    if (!precioLista) return '0';
    
    const delta = ((precioLista - this.data.precio_lista_actual) / this.data.precio_lista_actual) * 100;
    return delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  }

  getDeltaAmount(): string {
    const precioLista = this.costoForm.get('precio_lista')?.value;
    if (!precioLista) return '$0';
    
    const delta = precioLista - this.data.precio_lista_actual;
    return delta > 0 ? `+$${delta.toFixed(0)}` : `-$${Math.abs(delta).toFixed(0)}`;
  }

  getDeltaClass(): string {
    const precioLista = this.costoForm.get('precio_lista')?.value;
    if (!precioLista || precioLista === this.data.precio_lista_actual) return 'neutral';
    
    return precioLista > this.data.precio_lista_actual ? 'increase' : 'decrease';
  }

  getDeltaIcon(): string {
    const precioLista = this.costoForm.get('precio_lista')?.value;
    if (!precioLista || precioLista === this.data.precio_lista_actual) return 'remove';
    
    return precioLista > this.data.precio_lista_actual ? 'trending_up' : 'trending_down';
  }

  // ==================== ACCIONES ====================

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.puedeGuardar || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const formValue = this.costoForm.value;
    
    const updateData = {
      proveedor_id: this.data.proveedor_id,
      producto_id: this.data.producto_id,
      precio_lista: formValue.precio_lista,
      bonificaciones_ids: this.bonificacionesSeleccionadas,
      precio_neto_calculado: this.precioNetoCalculado,
      fecha_efectiva: formValue.fecha_efectiva,
      motivo: formValue.motivo,
      precio_lista_anterior: this.data.precio_lista_actual
    };

    // Simular llamada API (reemplazar con servicio real)
    setTimeout(() => {
      this.dialogRef.close(updateData);
      
      this.snackBar.open(
        `Precio Lista actualizado: $${this.data.precio_lista_actual.toFixed(0)} → $${formValue.precio_lista.toFixed(0)} | Neto Real: $${this.precioNetoCalculado.toFixed(0)}`,
        'Cerrar',
        { duration: 5000 }
      );
      
      this.isLoading = false;
    }, 1000);
  }
}
