import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { Cart, CartItem, CartEstado, CartService, SendOrdersResult } from '../../../../../core/services/cart.service';

@Component({
  selector: 'app-cart-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatDialogModule,
  ],
  templateUrl: './cart-view.html',
  styleUrl: './cart-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartView implements OnInit, OnDestroy {
  cart: Cart | null = null;
  displayedColumns = [
    'producto',
    'proveedor',
    'cantidad',
    'costo_unitario',
    'costo_total',
    'clase_c',
    'agregado_por',
    'actions',
  ];

  // Order splitting preview
  showSupplierGrouping = false;
  supplierGroups: { proveedor_id: number; proveedor_nombre: string; items: CartItem[]; total: number }[] = [];

  // TODO: Replace with AuthService
  userRole: 'AUXILIAR_COMPRAS' | 'JEFE_COMPRAS' = 'JEFE_COMPRAS';

  private cartSub!: Subscription;

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      if (this.showSupplierGrouping) {
        this.buildSupplierGroups();
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  // ============================================================================
  // ITEM ACTIONS
  // ============================================================================

  onQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQty = Number(input.value);
    if (!newQty || isNaN(newQty)) return;

    this.cartService.updateItemQuantity(item.id, newQty).subscribe({
      next: () => {
        this.snackBar.open('Cantidad actualizada', 'Cerrar', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al actualizar', 'Cerrar', { duration: 3000 });
        // Revert input
        input.value = String(item.cantidad);
      },
    });
  }

  onRemoveItem(item: CartItem): void {
    if (!confirm(`¿Eliminar "${item.nombre_comercial}" del carrito?`)) return;

    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        this.snackBar.open('Producto eliminado del carrito', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  // ============================================================================
  // CART ACTIONS
  // ============================================================================

  onSubmitForReview(): void {
    this.cartService.submitForReview().subscribe({
      next: () => {
        this.snackBar.open(
          'Carrito enviado a Jefe de Compras para validación',
          'Cerrar',
          { duration: 4000 },
        );
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al enviar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onApproveCart(): void {
    const comentario = prompt('Comentario de aprobación (opcional):');

    this.cartService.approveCart(comentario || '').subscribe({
      next: () => {
        this.snackBar.open(
          'Carrito aprobado. Ahora puede enviar las órdenes.',
          'Cerrar',
          { duration: 4000 },
        );
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al aprobar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onRejectCart(): void {
    const motivo = prompt('Motivo del rechazo (obligatorio):');
    if (!motivo) {
      this.snackBar.open('El motivo de rechazo es obligatorio', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cartService.rejectCart(motivo).subscribe({
      next: () => {
        this.snackBar.open('Carrito devuelto al Auxiliar para correcciones', 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al rechazar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onSendOrders(): void {
    if (!confirm('¿Enviar órdenes de compra a los proveedores?')) return;

    this.cartService.sendOrders().subscribe({
      next: (result: SendOrdersResult) => {
        this.snackBar.open(
          `${result.ordenes_creadas} órdenes enviadas exitosamente`,
          'Cerrar',
          { duration: 5000 },
        );
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error al enviar órdenes', 'Cerrar', { duration: 3000 });
      },
    });
  }

  // ============================================================================
  // SUPPLIER GROUPING PREVIEW
  // ============================================================================

  toggleSupplierGrouping(): void {
    this.showSupplierGrouping = !this.showSupplierGrouping;
    if (this.showSupplierGrouping) {
      this.buildSupplierGroups();
    }
  }

  private buildSupplierGroups(): void {
    const grouped = this.cartService.getItemsBySupplier();
    this.supplierGroups = Array.from(grouped.entries()).map(([provId, items]) => ({
      proveedor_id: provId,
      proveedor_nombre: items[0].proveedor_nombre,
      items,
      total: items.reduce((s, i) => s + i.costo_total, 0),
    }));
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  canSubmitCart(): boolean {
    return this.cart?.estado === 'DRAFT' && (this.cart?.items.length ?? 0) > 0;
  }

  canApproveCart(): boolean {
    return this.userRole === 'JEFE_COMPRAS' && this.cart?.estado === 'PENDING_REVIEW';
  }

  canRejectCart(): boolean {
    return this.userRole === 'JEFE_COMPRAS' && this.cart?.estado === 'PENDING_REVIEW';
  }

  canSendOrders(): boolean {
    return this.userRole === 'JEFE_COMPRAS' && this.cart?.estado === 'APPROVED';
  }

  isEditable(): boolean {
    return this.cart?.estado === 'DRAFT';
  }

  getEstadoLabel(estado: CartEstado): string {
    switch (estado) {
      case 'DRAFT': return 'Borrador';
      case 'PENDING_REVIEW': return 'En Revisión';
      case 'APPROVED': return 'Aprobado';
      case 'SENT': return 'Enviado';
      default: return estado;
    }
  }

  getEstadoClass(estado: CartEstado): string {
    switch (estado) {
      case 'DRAFT': return 'estado-draft';
      case 'PENDING_REVIEW': return 'estado-pending';
      case 'APPROVED': return 'estado-approved';
      case 'SENT': return 'estado-sent';
      default: return '';
    }
  }

  getEstadoIcon(estado: CartEstado): string {
    switch (estado) {
      case 'DRAFT': return 'edit_note';
      case 'PENDING_REVIEW': return 'hourglass_top';
      case 'APPROVED': return 'check_circle';
      case 'SENT': return 'local_shipping';
      default: return 'info';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
