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
  stockOptimo: number = 0;   // nivel óptimo = ROP + SS

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sdr'] && this.sdr) {
      this.calculateStockStatus();
    }
  }

  calculateStockStatus(): void {
    const stock = this.sdr.stock_actual;
    const rop = this.sdr.stock_minimo;
    const ss = this.sdr.stock_seguridad;

    const optimalStock = rop + ss;
    this.stockOptimo = optimalStock;
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

  /** ¿El backend entregó la cantidad sugerida oficial (Política v7.2)? */
  get tieneCalculoOficial(): boolean {
    return this.sdr?.cantidad_sugerida != null;
  }

  /** Disparador de reposición, según el cálculo oficial del backend. */
  get necesitaOrden(): boolean {
    return this.sdr?.necesita_orden === true;
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
      1: 'Familia 1: Estratégicos',
      2: 'Familia 2: Alta Disponibilidad',
      3: 'Familia 3: Especializados',
      4: 'Familia 4: Rutinarios'
    };
    return familyNames[this.sdr.familia] || `Familia ${this.sdr.familia}`;
  }

  getAbcLabel(): string {
    const labels: Record<string, string> = { A: 'ABC: A', B: 'ABC: B', C: 'ABC: C' };
    return this.sdr.clasificacion_abc ? (labels[this.sdr.clasificacion_abc] ?? `ABC: ${this.sdr.clasificacion_abc}`) : '';
  }

  getVedLabel(): string {
    const labels: Record<string, string> = { V: 'VED: V', E: 'VED: E', D: 'VED: D' };
    return this.sdr.clasificacion_ved ? (labels[this.sdr.clasificacion_ved] ?? `VED: ${this.sdr.clasificacion_ved}`) : '';
  }

  getHmlLabel(): string {
    const labels: Record<string, string> = { H: 'HML: H', M: 'HML: M', L: 'HML: L' };
    return this.sdr.clasificacion_hml ? (labels[this.sdr.clasificacion_hml] ?? `HML: ${this.sdr.clasificacion_hml}`) : '';
  }
}
