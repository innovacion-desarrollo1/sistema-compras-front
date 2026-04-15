import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Molecula } from '../../../../../core/services/molecula.service';

@Component({
  selector: 'app-molecule-inventory-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './molecule-inventory-info.html',
  styleUrl: './molecule-inventory-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoleculeInventoryInfo implements OnChanges {
  @Input() molecula!: Molecula;
  @Input() periodoSemanas: number = 4;

  stockStatus: 'CRITICO' | 'BAJO' | 'OPTIMO' | 'EXCESO' = 'OPTIMO';
  stockPercentage: number = 0;
  cantidadSugerida: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['molecula'] && this.molecula) {
      this.calculateStockStatus();
      this.calculateSuggestedOrderQuantity();
    }
  }

  calculateStockStatus(): void {
    const stock = this.molecula.stock_actual;
    const rop = this.molecula.stock_minimo;
    const ss = this.molecula.stock_seguridad;

    // Calculate as percentage of optimal stock (ROP + SS)
    const optimalStock = rop + ss;
    this.stockPercentage = (stock / optimalStock) * 100;

    // Determine status
    if (stock === 0) {
      this.stockStatus = 'CRITICO';
    } else if (stock < ss) {
      this.stockStatus = 'CRITICO';
    } else if (stock < rop) {
      this.stockStatus = 'BAJO';
    } else if (stock <= optimalStock * 1.2) {
      this.stockStatus = 'OPTIMO';
    } else {
      this.stockStatus = 'EXCESO';
    }
  }

  calculateSuggestedOrderQuantity(): void {
    const stock = this.molecula.stock_actual;
    const rop = this.molecula.stock_minimo;
    const ss = this.molecula.stock_seguridad;
    const pendientes = this.molecula.pendientes_diarios;

    // Suggested Qty = ROP + SS - Stock Actual - Pendientes
    this.cantidadSugerida = Math.max(0, rop + ss - stock - pendientes);

    // Round up to nearest EOQ multiple if applicable
    if (this.cantidadSugerida > 0 && this.molecula.eoq > 0) {
      const multiples = Math.ceil(this.cantidadSugerida / this.molecula.eoq);
      this.cantidadSugerida = multiples * this.molecula.eoq;
    }
  }

  getStockSemaphoreColor(): string {
    switch (this.stockStatus) {
      case 'CRITICO': return 'rojo';
      case 'BAJO': return 'amarillo';
      case 'OPTIMO': return 'verde';
      case 'EXCESO': return 'naranja';
      default: return 'gris';
    }
  }

  getStockIcon(): string {
    switch (this.stockStatus) {
      case 'CRITICO': return 'block';
      case 'BAJO': return 'priority_high';
      case 'OPTIMO': return 'check_circle';
      case 'EXCESO': return 'info';
      default: return 'help';
    }
  }

  getStockStatusText(): string {
    switch (this.stockStatus) {
      case 'CRITICO': return 'Stock Crítico - Ordenar Urgente';
      case 'BAJO': return 'Stock Bajo - Ordenar Pronto';
      case 'OPTIMO': return 'Stock Óptimo';
      case 'EXCESO': return 'Exceso de Stock';
      default: return 'Stock Desconocido';
    }
  }

  getDemandaCoverage(): number {
    // Coverage calculation based on period
    const diasPeriodo = this.periodoSemanas * 7;
    const demandaPeriodo = this.molecula.demanda_promedio_diaria * diasPeriodo;
    return this.molecula.stock_actual / demandaPeriodo;
  }

  getFamilyName(): string {
    const familyNames: Record<number, string> = {
      1: 'Familia 1: Rutinarios',
      2: 'Familia 2: Alta Disponibilidad',
      3: 'Familia 3: Especializados',
      4: 'Familia 4: Estratégicos'
    };
    return familyNames[this.molecula.familia] || `Familia ${this.molecula.familia}`;
  }
}
