import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SupplierRankingService, ProveedorRanking } from '../../../../core/services/supplier-ranking.service';
import { BonificacionService, Bonificacion } from '../../../../core/services/bonificacion.service';
import { CreateBonificacionDialog } from '../create-bonificacion-dialog/create-bonificacion-dialog';

@Component({
  selector: 'app-supplier-ranking-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './supplier-ranking-table.html',
  styleUrls: ['./supplier-ranking-table.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class SupplierRankingTableComponent implements OnInit, OnChanges {
  @Input() productoId!: number;
  @Input() periodoSemanas: number = 4;
  @Output() supplierSelected = new EventEmitter<any>();

  suppliers: ProveedorRanking[] = [];
  bonificacionesBySupplier: Map<number, Bonificacion[]> = new Map();
  selectedSupplier: ProveedorRanking | null = null;
  expandedSupplier: number | null = null; // For inline bonificaciones expansion
  isLoading = true;

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
    private bonificacionService: BonificacionService,
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
        // Load bonifications for each supplier
        this.suppliers.forEach(supplier => {
          this.loadBonificaciones(supplier.proveedor_id);
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar ranking de proveedores:', err);
        this.isLoading = false;
      }
    });
  }

  loadBonificaciones(proveedor_id: number): void {
    this.bonificacionService.getBonificacionesVigentes(proveedor_id, this.productoId).subscribe({
      next: (bonificaciones) => {
        this.bonificacionesBySupplier.set(proveedor_id, bonificaciones);
      },
      error: (err) => {
        console.error(`Error al cargar bonificaciones para proveedor ${proveedor_id}:`, err);
      }
    });
  }

  getBonificaciones(proveedor_id: number): Bonificacion[] {
    return this.bonificacionesBySupplier.get(proveedor_id) || [];
  }

  toggleBonificacion(bonificacion: Bonificacion, event: any): void {
    if (event.checked) {
      this.bonificacionService.applyBonificacion(bonificacion);
    } else {
      this.bonificacionService.removeBonificacion(bonificacion.id!);
    }
    // Recalcular costo con bonificaciones aplicadas
    if (this.selectedSupplier && this.selectedSupplier.proveedor_id === bonificacion.proveedor_id) {
      this.updateCostoConBonificaciones(this.selectedSupplier);
    }
  }

  selectSupplierForOrder(supplier: ProveedorRanking): void {
    this.selectedSupplier = supplier;
    
    // Calcular cantidad sugerida basada en periodo
    const cantidad_calculada = this.calculateCantidadSugerida(supplier);
    
    // Calcular costo con bonificaciones aplicadas
    const costoData = this.updateCostoConBonificaciones(supplier);
    
    // Emit to parent
    this.supplierSelected.emit({
      proveedor_id: supplier.proveedor_id,
      proveedor_nombre: supplier.proveedor_nombre,
      precio_unitario: supplier.costo_real_neto,
      cantidad_calculada: cantidad_calculada,
      costo_total_con_bonificaciones: costoData.costo_total,
      bonificaciones_aplicadas: this.bonificacionService.getAppliedBonificaciones()
    });
  }

  private calculateCantidadSugerida(supplier: ProveedorRanking): number {
    // Simulación: 50 unidades por semana
    const demanda_semanal = 50;
    return demanda_semanal * this.periodoSemanas;
  }

  private updateCostoConBonificaciones(supplier: ProveedorRanking): {costo_unitario: number, costo_total: number} {
    const cantidad = this.calculateCantidadSugerida(supplier);
    const precio_lista = supplier.costo_real_neto; // Base price
    
    const descuento_total = this.bonificacionService.calculateTotalDiscount(precio_lista, cantidad);
    const costo_total = (precio_lista * cantidad) - descuento_total;
    const costo_unitario = costo_total / cantidad;
    
    return { costo_unitario, costo_total };
  }

  toggleBonificacionesRow(supplierId: number): void {
    this.expandedSupplier = this.expandedSupplier === supplierId ? null : supplierId;
  }

  isRowExpanded(supplierId: number): boolean {
    return this.expandedSupplier === supplierId;
  }

  hasBonificaciones(supplierId: number): boolean {
    const bonifs = this.getBonificaciones(supplierId);
    return bonifs.length > 0;
  }

  getBonificacionesCount(supplierId: number): number {
    return this.getBonificaciones(supplierId).length;
  }

  getAppliedBonificacionesCount(supplierId: number): number {
    return this.getBonificaciones(supplierId).filter(b => b.aplicada_a_orden).length;
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

  openCreateBonificacionDialog(supplier: ProveedorRanking): void {
    const dialogRef = this.dialog.open(CreateBonificacionDialog, {
      width: '500px',
      data: {
        proveedor_id: supplier.proveedor_id,
        proveedor_nombre: supplier.proveedor_nombre,
        molecula_id: this.productoId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Create bonification via service
        this.bonificacionService.createBonificacion(result).subscribe({
          next: (newBonif) => {
            console.log('Bonificación creada:', newBonif);
            // Reload bonifications for this supplier
            this.loadBonificaciones(supplier.proveedor_id);
          },
          error: (err) => {
            console.error('Error al crear bonificación:', err);
          }
        });
      }
    });
  }

  isTopSupplier(index: number): boolean {
    return index === 0;
  }

  isExpandableRow = (): boolean => {
    return true; // All rows can be expanded
  };
}
