import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BonificacionService, Bonificacion } from '../../../../../core/services/bonificacion.service';
import { AgregarBonificacionDialog } from '../agregar-bonificacion-dialog/agregar-bonificacion-dialog';

export interface GestionarBonificacionesData {
  proveedor_id: number;
  proveedor_nombre: string;
  producto_id: number;
  bonificaciones_actuales: Bonificacion[];
}

@Component({
  selector: 'app-gestionar-bonificaciones-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="bonif-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>discount</mat-icon>
        Gestionar Bonificaciones - {{ data.proveedor_nombre }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <!-- Descripción -->
        <div class="description-box">
          <mat-icon>info</mat-icon>
          <div>
            <p><strong>Gestione bonificaciones de forma independiente</strong></p>
            <p>Seleccione las bonificaciones vigentes para este proveedor. Los cambios se aplicarán sin modificar el precio base.</p>
          </div>
        </div>

        <!-- Lista de bonificaciones disponibles -->
        <mat-card class="bonif-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>list</mat-icon>
              Bonificaciones Disponibles
            </mat-card-title>
            <mat-card-subtitle>
              Seleccione las bonificaciones que desea aplicar a este proveedor para este producto
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Botón para crear nueva bonificación -->
            <div class="create-bonif-section">
              <button 
                mat-raised-button 
                color="accent"
                (click)="agregarBonificacionPersonalizada()">
                <mat-icon>add_circle</mat-icon>
                Crear Bonificación Personalizada
              </button>
            </div>

            <!-- Sin bonificaciones disponibles -->
            <div *ngIf="bonificacionesDisponibles.length === 0" class="no-bonif-message">
              <mat-icon>info_outline</mat-icon>
              <p>No hay bonificaciones vigentes para este proveedor y producto.</p>
              <p class="hint">Cree una bonificación personalizada para comenzar.</p>
            </div>

            <!-- Listado de bonificaciones -->
            <div *ngIf="bonificacionesDisponibles.length > 0" class="bonif-list">
              <mat-checkbox 
                *ngFor="let bonif of bonificacionesDisponibles"
                [checked]="bonificacionesSeleccionadas.includes(bonif.id!)"
                (change)="toggleBonificacion(bonif.id!, $event.checked)"
                color="primary"
                class="bonif-checkbox">
                <div class="bonif-item">
                  <div class="bonif-info">
                    <span class="bonif-desc">{{ bonif.descripcion }}</span>
                    <div class="bonif-details">
                      <mat-chip class="bonif-type-chip" [ngClass]="'tipo-' + bonif.tipo.toLowerCase()">
                        <mat-icon *ngIf="bonif.tipo === 'PORCENTAJE'">percent</mat-icon>
                        <mat-icon *ngIf="bonif.tipo === 'DESCUENTO_FIJO'">attach_money</mat-icon>
                        <mat-icon *ngIf="bonif.tipo === 'UNIDADES_GRATIS'">card_giftcard</mat-icon>
                        <span *ngIf="bonif.tipo === 'PORCENTAJE'">{{ bonif.valor }}%</span>
                        <span *ngIf="bonif.tipo === 'DESCUENTO_FIJO'">\${{ bonif.valor | number:'1.0-0' }}</span>
                        <span *ngIf="bonif.tipo === 'UNIDADES_GRATIS'">{{ bonif.unidades_compradas }}+{{ bonif.unidades_gratis }}</span>
                      </mat-chip>
                      <span class="bonif-validity">
                        <mat-icon>event</mat-icon>
                        {{ bonif.es_permanente ? 'Permanente' : 'Hasta ' + (bonif.fecha_fin | date:'dd/MM/yyyy') }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Botón eliminar solo para bonificaciones personalizadas -->
                  <button 
                    *ngIf="bonif.id && bonif.id < 0"
                    mat-icon-button 
                    color="warn"
                    (click)="eliminarBonificacion(bonif.id!); $event.stopPropagation()"
                    matTooltip="Eliminar bonificación personalizada">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-checkbox>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Resumen de descuento total -->
        <mat-card class="summary-section" *ngIf="bonificacionesSeleccionadas.length > 0">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon class="summary-icon">discount</mat-icon>
              <div class="summary-text">
                <strong>{{ bonificacionesSeleccionadas.length }} bonificación(es) seleccionada(s)</strong>
                <p class="summary-note">Los descuentos se aplicarán al calcular el precio neto en el próximo pedido</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="cancelar()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="guardar()">
          <mat-icon>save</mat-icon>
          Guardar Bonificaciones
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .bonif-dialog {
      min-width: 500px;
      max-width: 700px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1e40af;
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 8px;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    /* ===== DESCRIPTION BOX ===== */
    .description-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      margin-bottom: 20px;

      mat-icon {
        color: #1e40af;
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      div {
        flex: 1;
      }

      p {
        margin: 0 0 8px 0;
        color: #1e3a8a;
        font-size: 14px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }

        strong {
          font-weight: 600;
          font-size: 15px;
        }
      }
    }

    /* ===== BONIFICACIONES SECTION ===== */
    .bonif-section {
      margin-bottom: 20px;
      border-left: 4px solid #059669;

      mat-card-header {
        margin-bottom: 16px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #047857;

          mat-icon {
            font-size: 22px;
            width: 22px;
            height: 22px;
          }
        }

        mat-card-subtitle {
          margin-top: 8px;
          color: #6b7280;
          font-size: 14px;
        }
      }
    }

    .create-bonif-section {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px dashed #e5e7eb;

      button {
        mat-icon {
          margin-right: 8px;
        }
      }
    }

    .no-bonif-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: #6b7280;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #9ca3af;
        margin-bottom: 16px;
      }

      p {
        margin: 8px 0;
        font-size: 14px;

        &.hint {
          color: #9ca3af;
          font-style: italic;
          font-size: 13px;
        }
      }
    }

    /* ===== BONIFICACIONES LIST ===== */
    .bonif-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .bonif-checkbox {
        width: 100%;

        ::ng-deep .mdc-form-field {
          width: 100%;
        }

        ::ng-deep .mdc-label {
          width: 100%;
        }

        .bonif-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #f9fafb;
          transition: all 0.2s ease;

          &:hover {
            background-color: #f3f4f6;
            border-color: #d1d5db;
          }
        }

        .bonif-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bonif-desc {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }

        .bonif-details {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .bonif-type-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }

          &.tipo-porcentaje {
            background-color: #dcfce7;
            color: #166534;
          }

          &.tipo-descuento_fijo {
            background-color: #fef3c7;
            color: #92400e;
          }

          &.tipo-unidades_gratis {
            background-color: #dbeafe;
            color: #1e40af;
          }
        }

        .bonif-validity {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }

        button[mat-icon-button] {
          width: 36px;
          height: 36px;
          flex-shrink: 0;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }
    }

    /* ===== SUMMARY SECTION ===== */
    .summary-section {
      background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
      border-left: 4px solid #10b981;

      .summary-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .summary-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #059669;
        flex-shrink: 0;
      }

      .summary-text {
        flex: 1;

        strong {
          display: block;
          font-size: 16px;
          color: #065f46;
          margin-bottom: 4px;
        }

        .summary-note {
          margin: 0;
          font-size: 13px;
          color: #047857;
          font-style: italic;
        }
      }
    }

    /* ===== ACTIONS ===== */
    .dialog-actions {
      padding: 16px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #e5e7eb;

      button {
        mat-icon {
          margin-right: 6px;
        }
      }
    }
  `]
})
export class GestionarBonificacionesDialog implements OnInit {
  bonificacionesDisponibles: Bonificacion[] = [];
  bonificacionesSeleccionadas: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<GestionarBonificacionesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: GestionarBonificacionesData,
    private bonificacionService: BonificacionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Cargar bonificaciones vigentes para este proveedor y producto
    this.bonificacionService.getBonificaciones().subscribe((bonificaciones: Bonificacion[]) => {
      this.bonificacionesDisponibles = bonificaciones.filter((b: Bonificacion) => 
        b.proveedor_id === this.data.proveedor_id &&
        b.molecula_id === this.data.producto_id &&
        b.es_vigente
      );
      
      // Pre-seleccionar bonificaciones actuales
      if (this.data.bonificaciones_actuales) {
        this.bonificacionesSeleccionadas = this.data.bonificaciones_actuales
          .map(b => b.id!)
          .filter(id => id !== undefined);
      }
    });
  }

  toggleBonificacion(bonifId: number, checked: boolean): void {
    if (checked) {
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

  agregarBonificacionPersonalizada(): void {
    const dialogRef = this.dialog.open(AgregarBonificacionDialog, {
      width: '500px',
      data: {
        proveedor_id: this.data.proveedor_id,
        producto_id: this.data.producto_id
      }
    });

    dialogRef.afterClosed().subscribe((nuevaBonificacion: Bonificacion | null) => {
      if (nuevaBonificacion) {
        // Agregar a la lista de disponibles
        this.bonificacionesDisponibles.push(nuevaBonificacion);
        
        // Auto-seleccionar la nueva bonificación
        if (nuevaBonificacion.id) {
          this.bonificacionesSeleccionadas.push(nuevaBonificacion.id);
        }
        
        this.snackBar.open(
          `Bonificación "${nuevaBonificacion.descripcion}" creada y aplicada`,
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  eliminarBonificacion(bonifId: number): void {
    // Deseleccionar si estaba seleccionada
    const selectedIndex = this.bonificacionesSeleccionadas.indexOf(bonifId);
    if (selectedIndex > -1) {
      this.bonificacionesSeleccionadas.splice(selectedIndex, 1);
    }

    // Eliminar de la lista de disponibles
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

  guardar(): void {
    // Obtener bonificaciones seleccionadas completas
    const bonificacionesSeleccionadasCompletas = this.bonificacionesDisponibles
      .filter(b => this.bonificacionesSeleccionadas.includes(b.id!));

    this.dialogRef.close({
      bonificaciones: bonificacionesSeleccionadasCompletas,
      bonificaciones_ids: this.bonificacionesSeleccionadas
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
