import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SupplierRankingService, ProveedorRanking } from '../../../../core/services/supplier-ranking.service';
import { CostoProveedorService } from '../../../../core/services/costo-proveedor.service';
import { CartService } from '../../../../core/services/cart.service';
import { UpdateCostoDialog } from '../update-costo-dialog/update-costo-dialog';
import { GestionarBonificacionesDialog } from '../gestionar-bonificaciones-dialog/gestionar-bonificaciones-dialog';

@Component({
  selector: 'app-supplier-ranking-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './supplier-ranking-table.html',
  styleUrls: ['./supplier-ranking-table.scss']
})
export class SupplierRankingTableComponent implements OnInit, OnChanges {
  @Input() productoId!: number;
  @Input() periodoSemanas: number = 4;
  @Input() moleculaNombre: string = '';
  @Input() moleculaFamilia: number = 1;
  @Input() esClaseC: boolean = false;
  @Output() supplierSelected = new EventEmitter<any>();
  @Output() addedToCart = new EventEmitter<void>();

  suppliers: ProveedorRanking[] = [];
  selectedSupplier: ProveedorRanking | null = null;
  isLoading = true;

  /** Cantidad editable por proveedor (proveedor_id → cantidad) */
  cantidades: Map<number, number> = new Map();

  displayedColumns: string[] = [
    'ranking',
    'proveedor',
    'costos',
    'kpis',
    'bonificaciones',
    'actions'
  ];

  constructor(
    private rankingService: SupplierRankingService,
    private costoProveedorService: CostoProveedorService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.productoId) {
      this.loadRanking();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productoId'] && !changes['productoId'].firstChange) {
      this.loadRanking();
    }
  }

  loadRanking(): void {
    this.isLoading = true;
    this.rankingService.getRanking(this.productoId).subscribe({
      next: (data) => {
        this.suppliers = data;
        // Pre-fill quantities for each supplier
        data.forEach(s => {
          if (!this.cantidades.has(s.proveedor_id)) {
            this.cantidades.set(s.proveedor_id, this.calculateCantidadSugerida(s));
          }
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar ranking de proveedores:', err);
        this.isLoading = false;
      }
    });
  }

  /** Obtiene la cantidad editable para un proveedor */
  getCantidad(supplierId: number): number {
    return this.cantidades.get(supplierId) ?? 0;
  }

  /** Actualiza la cantidad cuando el usuario edita el input */
  onCantidadChange(supplierId: number, value: number): void {
    this.cantidades.set(supplierId, Math.max(1, Math.round(value)));
  }

  /** Agrega directamente al carrito desde la tabla */
  addToCart(supplier: ProveedorRanking): void {
    const cantidad = this.getCantidad(supplier.proveedor_id);
    if (cantidad <= 0) {
      this.snackBar.open('La cantidad debe ser mayor a 0', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cartService.addItem({
      producto_id: this.productoId,
      nombre_comercial: this.moleculaNombre,
      molecula: this.moleculaNombre,
      familia: this.moleculaFamilia,
      cantidad: cantidad,
      moq: 1, // TODO: obtener MOQ real del proveedor
      proveedor_id: supplier.proveedor_id,
      proveedor_nombre: supplier.proveedor_nombre,
      precio_lista: supplier.precio_lista,
      bonificaciones: supplier.bonificaciones_total,
      costo_real_neto: supplier.costo_real_neto,
      es_clase_c: this.esClaseC || supplier.requiere_aprobacion
    }).subscribe({
      next: () => {
        this.snackBar.open(
          `${this.moleculaNombre} × ${cantidad} agregado al carrito (${supplier.proveedor_nombre})`,
          'Ver Carrito',
          { duration: 4000 }
        ).onAction().subscribe(() => this.addedToCart.emit());
        this.addedToCart.emit();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al agregar al carrito';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      }
    });
  }

  selectSupplierForOrder(supplier: ProveedorRanking): void {
    this.selectedSupplier = supplier;
    
    const cantidad_calculada = this.getCantidad(supplier.proveedor_id);
    const costo_total = supplier.costo_real_neto * cantidad_calculada;
    
    this.supplierSelected.emit({
      proveedor_id: supplier.proveedor_id,
      proveedor_nombre: supplier.proveedor_nombre,
      precio_unitario: supplier.costo_real_neto,
      cantidad_calculada: cantidad_calculada,
      costo_total: costo_total,
      bonificaciones_aplicadas: supplier.bonificaciones_aplicadas || []
    });
  }

  private calculateCantidadSugerida(supplier: ProveedorRanking): number {
    // Simulación: 50 unidades por semana
    const demanda_semanal = 50;
    return demanda_semanal * this.periodoSemanas;
  }

  getSemaphoreColor(supplier: ProveedorRanking, index: number): string {
    if (supplier.requiere_aprobacion) return 'naranja';
    if (index === 0) return 'verde'; // Top supplier
    if (supplier.kpi_score < 70) return 'amarillo'; // Poor performance
    return 'gris';
  }

  getSemaphoreText(supplier: ProveedorRanking, index: number): string {
    if (supplier.requiere_aprobacion) return 'Clase C - Requiere Aprobación';
    if (index === 0) return 'Recomendado';
    if (supplier.kpi_score < 70) return 'KPI Bajo';
    return 'Disponible';
  }

  getKpiClass(kpi: number): string {
    if (kpi >= 85) return 'kpi-good';
    if (kpi >= 70) return 'kpi-ok';
    return 'kpi-poor';
  }

  selectSupplier(supplier: ProveedorRanking): void {
    console.log('[Supplier Ranking] Supplier selected:', supplier);
    this.supplierSelected.emit(supplier);
  }

  isTopSupplier(index: number): boolean {
    return index === 0;
  }

  /**
   * Abre el dialog para gestionar bonificaciones del proveedor
   */
  openGestionarBonificacionesDialog(supplier: ProveedorRanking): void {
    const dialogRef = this.dialog.open(GestionarBonificacionesDialog, {
      width: '700px',
      maxHeight: '90vh',
      data: {
        proveedor_id: supplier.proveedor_id,
        proveedor_nombre: supplier.proveedor_nombre,
        producto_id: this.productoId,
        bonificaciones_actuales: supplier.bonificaciones_aplicadas || []
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Bonificaciones actualizadas:', result);
        // TODO: Actualizar las bonificaciones del proveedor vía servicio
        // this.costoProveedorService.updateBonificaciones(...).subscribe(...);
        
        this.snackBar.open(
          `Bonificaciones actualizadas para ${supplier.proveedor_nombre}`,
          'Cerrar',
          { duration: 3000 }
        );
        
        // Recargar suppliers para reflejar cambios
        this.loadRanking();
      }
    });
  }

  /**
   * Abre el dialog para actualizar el precio de un proveedor
   */
  openUpdateCostoDialog(supplier: ProveedorRanking, scrollTo?: string): void {
    const dialogRef = this.dialog.open(UpdateCostoDialog, {
      width: '650px',
      maxHeight: '90vh',
      data: {
        proveedor_id: supplier.proveedor_id,
        proveedor_nombre: supplier.proveedor_nombre,
        producto_id: this.productoId,
        precio_lista_actual: supplier.precio_lista,
        bonificaciones_actuales: supplier.bonificaciones_aplicadas || [],
        scrollTo: scrollTo  // 'bonificaciones' si se clickea la columna
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar precio a través del servicio
        this.costoProveedorService.updateCosto(result).subscribe({
          next: () => {
            console.log('[Supplier Ranking] Precio Lista actualizado exitosamente:', result);
            
            // Recargar ranking para reflejar el nuevo precio
            this.loadRanking();
            
            this.snackBar.open(
              `Precio Lista actualizado para ${supplier.proveedor_nombre}: $${result.precio_lista_anterior.toFixed(0)} → $${result.precio_lista.toFixed(0)} | Neto Real: $${result.precio_neto_calculado.toFixed(0)}`,
              'Cerrar',
              { duration: 5000 }
            );
          },
          error: (err) => {
            console.error('[Supplier Ranking] Error al actualizar costo:', err);
            this.snackBar.open(
              'Error al actualizar el precio. Intente nuevamente.',
              'Cerrar',
              { duration: 3000 }
            );
          }
        });
      }
    });
  }
}
