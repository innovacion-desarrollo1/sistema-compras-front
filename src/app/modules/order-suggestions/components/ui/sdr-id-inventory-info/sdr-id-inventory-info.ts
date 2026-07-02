import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Molecula } from '../../../../../core/services/molecula.service';

@Component({
  selector: 'app-sdr-id-inventory-info',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './sdr-id-inventory-info.html',
  styleUrl: './sdr-id-inventory-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SdrIdInventoryInfo implements OnChanges {
  @Input() sdr!: Molecula;
  @Input() periodoSemanas: number = 4;

  stockStatus: 'CRITICO' | 'BAJO' | 'OPTIMO' | 'EXCESO' = 'OPTIMO';
  stockPercentage: number = 0;
  cantidadSugerida: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sdr'] && this.sdr) {
      this.calculateStockStatus();
      this.calculateSuggestedOrderQuantity();
    }
  }

  calculateStockStatus(): void {
    const stock = this.sdr.stock_actual;
    const rop = this.sdr.stock_minimo;
    const ss = this.sdr.stock_seguridad;

    const optimalStock = rop + ss;
    this.stockPercentage = optimalStock > 0 ? (stock / optimalStock) * 100 : 0;

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
    const stock = this.sdr.stock_actual;
    const rop = this.sdr.stock_minimo;
    const ss = this.sdr.stock_seguridad;
    const pendientes = this.sdr.pendientes_diarios;

    this.cantidadSugerida = Math.max(0, rop + ss - stock - pendientes);

    if (this.cantidadSugerida > 0 && this.sdr.eoq > 0) {
      const multiples = Math.ceil(this.cantidadSugerida / this.sdr.eoq);
      this.cantidadSugerida = multiples * this.sdr.eoq;
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
    const diasPeriodo = this.periodoSemanas * 7;
    const demandaPeriodo = this.sdr.demanda_promedio_diaria * diasPeriodo;
    return demandaPeriodo > 0 ? this.sdr.stock_actual / demandaPeriodo : 0;
  }

  getFamilyName(): string {
    const familyNames: Record<number, string> = {
      1: 'Familia 1: Rutinarios',
      2: 'Familia 2: Alta Disponibilidad',
      3: 'Familia 3: Especializados',
      4: 'Familia 4: Estratégicos'
    };
    return familyNames[this.sdr.familia] || `Familia ${this.sdr.familia}`;
  }
}
