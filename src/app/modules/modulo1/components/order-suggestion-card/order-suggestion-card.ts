import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { SugerenciaOrden } from '../../services/suggestion-state.service';

@Component({
  selector: 'app-order-suggestion-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './order-suggestion-card.html',
  styleUrl: './order-suggestion-card.scss',
})
export class OrderSuggestionCard {
  @Input() suggestion!: SugerenciaOrden;
  @Output() accepted = new EventEmitter<SugerenciaOrden>();
  @Output() adjusted = new EventEmitter<{ suggestion: SugerenciaOrden, newQuantity: number }>();
  @Output() rejected = new EventEmitter<{ suggestion: SugerenciaOrden, reason: string }>();

  getStockSemaphore(): string {
    if (this.suggestion.es_clase_c) return 'naranja';
    // TODO: Get actual stock data
    return 'verde';
  }

  getSemaphoreIcon(): string {
    const color = this.getStockSemaphore();
    if (color === 'naranja') return 'gavel';
    if (color === 'negro') return 'block';
    if (color === 'rojo') return 'priority_high';
    if (color === 'amarillo') return 'warning';
    return 'check_circle';
  }

  onAccept(): void {
    if (this.suggestion.es_clase_c && this.suggestion.estado_aprobacion !== 'APROBADO') {
      alert('No se puede aceptar sugerencia Clase C sin aprobación');
      return;
    }
    this.accepted.emit(this.suggestion);
  }

  onAdjust(): void {
    const newQuantity = prompt(
      `Cantidad actual: ${this.suggestion.cantidad_sugerida}. Ingrese nueva cantidad:`,
      this.suggestion.cantidad_sugerida.toString()
    );
    
    if (newQuantity && !isNaN(Number(newQuantity))) {
      this.adjusted.emit({ 
        suggestion: this.suggestion, 
        newQuantity: Number(newQuantity) 
      });
    }
  }

  onReject(): void {
    const reason = prompt('Motivo del rechazo:');
    if (reason) {
      this.rejected.emit({ suggestion: this.suggestion, reason });
    }
  }

  getApprovalStatusClass(): string {
    if (!this.suggestion.estado_aprobacion) return 'status-pending';
    return `status-${this.suggestion.estado_aprobacion.toLowerCase()}`;
  }
}
