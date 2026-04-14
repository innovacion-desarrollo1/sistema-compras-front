import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SugerenciaOrden } from '../../services/suggestion-state.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-order-suggestion-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './order-suggestion-card.html',
  styleUrl: './order-suggestion-card.scss',
})
export class OrderSuggestionCard {
  @Input() suggestion!: SugerenciaOrden;
  @Output() accepted = new EventEmitter<SugerenciaOrden>();
  @Output() adjusted = new EventEmitter<{ suggestion: SugerenciaOrden, newQuantity: number }>();
  @Output() rejected = new EventEmitter<{ suggestion: SugerenciaOrden, reason: string }>();
  @Output() addedToCart = new EventEmitter<SugerenciaOrden>();

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  onAddToCart(): void {
    const item = {
      producto_id: this.suggestion.producto_id,
      nombre_comercial: this.suggestion.producto_nombre,
      molecula: this.suggestion.producto_nombre,
      familia: 1,
      cantidad: this.suggestion.cantidad_sugerida,
      moq: 1,
      proveedor_id: this.suggestion.proveedor_id,
      proveedor_nombre: this.suggestion.proveedor_nombre,
      precio_lista: this.suggestion.precio_unitario,
      bonificaciones: 0,
      costo_real_neto: this.suggestion.precio_unitario,
      es_clase_c: this.suggestion.es_clase_c,
    };

    this.cartService.addItem(item).subscribe({
      next: (cart) => {
        this.snackBar.open(
          `Producto agregado al carrito (${cart.total_productos} productos)`,
          'Cerrar',
          { duration: 4000 }
        );
        this.addedToCart.emit(this.suggestion);
      },
      error: (err) => {
        if (err.error?.code === 'DUPLICATE_ITEM') {
          this.snackBar.open('Este producto ya está en el carrito', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('Error al agregar al carrito', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

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
