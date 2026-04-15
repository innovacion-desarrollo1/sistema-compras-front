import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CartItem {
  id: number;
  producto_id: number;
  nombre_comercial: string;
  molecula: string;
  familia: number;

  cantidad: number;
  moq: number;

  proveedor_id: number;
  proveedor_nombre: string;

  precio_lista: number;
  bonificaciones: number;
  costo_real_neto: number;
  costo_total: number;

  es_clase_c: boolean;
  fecha_agregado: Date;
  agregado_por_usuario_id: number;
  agregado_por_usuario_nombre: string;
}

export type CartEstado = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'SENT';

export interface Cart {
  id: number;
  items: CartItem[];
  estado: CartEstado;

  total_productos: number;
  total_costo: number;
  tiene_clase_c: boolean;
  proveedores_unicos: number;

  creado_por_usuario_id: number;
  fecha_creacion: Date;
  fecha_ultima_modificacion: Date;
  validado_por_jefe_id?: number;
  fecha_validacion?: Date;
  comentario_aprobacion?: string;
  comentario_rechazo?: string;
  enviado_por_jefe_id?: number;
  fecha_envio?: Date;
}

export interface SendOrdersResult {
  ordenes_creadas: number;
  ids: number[];
  detalles: {
    orden_id: number;
    proveedor_id: number;
    proveedor_nombre: string;
    items_count: number;
    total_cost: number;
  }[];
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  private nextItemId = 1;
  private nextCartId = 1;

  // TODO: Replace mock user with AuthService
  private currentUserId = 55;
  private currentUserName = 'Maria Gonzalez';

  constructor() {}

  /** Get current cart snapshot */
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  /** Get item count for badge */
  getItemCount(): number {
    return this.cartSubject.value?.items.length ?? 0;
  }

  /** Check if a producto_id already exists in the cart (any supplier) */
  hasProduct(productoId: number): boolean {
    return this.cartSubject.value?.items.some(i => i.producto_id === productoId) ?? false;
  }

  /** Add item to cart. Creates cart if none exists. */
  addItem(item: {
    producto_id: number;
    nombre_comercial: string;
    molecula: string;
    familia: number;
    cantidad: number;
    moq: number;
    proveedor_id: number;
    proveedor_nombre: string;
    precio_lista: number;
    bonificaciones: number;
    costo_real_neto: number;
    es_clase_c: boolean;
  }): Observable<Cart> {
    let cart = this.cartSubject.value;

    // Check for duplicate
    if (cart) {
      const exists = cart.items.some(
        i => i.producto_id === item.producto_id && i.proveedor_id === item.proveedor_id
      );
      if (exists) {
        return throwError(() => ({
          error: { code: 'DUPLICATE_ITEM', message: 'Este producto ya está en el carrito' }
        }));
      }
    }

    // Create cart if not exists
    if (!cart) {
      cart = this.createEmptyCart();
    }

    const newItem: CartItem = {
      id: this.nextItemId++,
      ...item,
      costo_total: item.cantidad * item.costo_real_neto,
      fecha_agregado: new Date(),
      agregado_por_usuario_id: this.currentUserId,
      agregado_por_usuario_nombre: this.currentUserName,
    };

    cart = {
      ...cart,
      items: [...cart.items, newItem],
      fecha_ultima_modificacion: new Date(),
    };

    cart = this.recalculateTotals(cart);
    this.cartSubject.next(cart);

    // TODO: Replace with HTTP POST /api/v1/cart/add
    return of(cart).pipe(delay(200));
  }

  /** Update item quantity in cart */
  updateItemQuantity(itemId: number, newQuantity: number): Observable<Cart> {
    let cart = this.cartSubject.value;
    if (!cart) {
      return throwError(() => ({ error: { message: 'No hay carrito activo' } }));
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      return throwError(() => ({ error: { message: 'Item no encontrado' } }));
    }

    if (newQuantity < item.moq) {
      return throwError(() => ({
        error: { code: 'BELOW_MOQ', message: `Cantidad mínima: ${item.moq} unidades` }
      }));
    }

    cart = {
      ...cart,
      items: cart.items.map(i =>
        i.id === itemId
          ? { ...i, cantidad: newQuantity, costo_total: newQuantity * i.costo_real_neto }
          : i
      ),
      fecha_ultima_modificacion: new Date(),
    };

    cart = this.recalculateTotals(cart);
    this.cartSubject.next(cart);

    // TODO: Replace with HTTP PUT /api/v1/cart/items/{itemId}
    return of(cart).pipe(delay(150));
  }

  /** Remove item from cart */
  removeItem(itemId: number): Observable<Cart> {
    let cart = this.cartSubject.value;
    if (!cart) {
      return throwError(() => ({ error: { message: 'No hay carrito activo' } }));
    }

    cart = {
      ...cart,
      items: cart.items.filter(i => i.id !== itemId),
      fecha_ultima_modificacion: new Date(),
    };

    // If cart is empty, clear it
    if (cart.items.length === 0) {
      this.cartSubject.next(null);
      return of(cart).pipe(delay(150));
    }

    cart = this.recalculateTotals(cart);
    this.cartSubject.next(cart);

    // TODO: Replace with HTTP DELETE /api/v1/cart/items/{itemId}
    return of(cart).pipe(delay(150));
  }

  /** Submit cart for Jefe review */
  submitForReview(): Observable<Cart> {
    let cart = this.cartSubject.value;
    if (!cart || cart.items.length === 0) {
      return throwError(() => ({ error: { message: 'El carrito está vacío' } }));
    }
    if (cart.estado !== 'DRAFT') {
      return throwError(() => ({
        error: { message: `No se puede enviar un carrito en estado ${cart!.estado}` }
      }));
    }

    cart = { ...cart, estado: 'PENDING_REVIEW', fecha_ultima_modificacion: new Date() };
    this.cartSubject.next(cart);

    // TODO: Replace with HTTP PUT /api/v1/cart/submit
    return of(cart).pipe(delay(300));
  }

  /** Jefe approves cart */
  approveCart(comentario: string): Observable<Cart> {
    let cart = this.cartSubject.value;
    if (!cart || cart.estado !== 'PENDING_REVIEW') {
      return throwError(() => ({
        error: { message: 'El carrito no está en estado de revisión' }
      }));
    }

    cart = {
      ...cart,
      estado: 'APPROVED',
      validado_por_jefe_id: this.currentUserId,
      fecha_validacion: new Date(),
      comentario_aprobacion: comentario,
      fecha_ultima_modificacion: new Date(),
    };
    this.cartSubject.next(cart);

    // TODO: Replace with HTTP POST /api/v1/cart/approve
    return of(cart).pipe(delay(300));
  }

  /** Jefe rejects cart and requests changes */
  rejectCart(motivo: string): Observable<Cart> {
    let cart = this.cartSubject.value;
    if (!cart || cart.estado !== 'PENDING_REVIEW') {
      return throwError(() => ({
        error: { message: 'El carrito no está en estado de revisión' }
      }));
    }

    cart = {
      ...cart,
      estado: 'DRAFT',
      comentario_rechazo: motivo,
      fecha_ultima_modificacion: new Date(),
    };
    this.cartSubject.next(cart);

    // TODO: Replace with HTTP POST /api/v1/cart/reject
    return of(cart).pipe(delay(300));
  }

  /** Jefe sends orders — cart splits by supplier */
  sendOrders(): Observable<SendOrdersResult> {
    const cart = this.cartSubject.value;
    if (!cart || cart.estado !== 'APPROVED') {
      return throwError(() => ({
        error: { message: 'El carrito debe estar aprobado para enviar órdenes' }
      }));
    }

    const grouped = this.getItemsBySupplier();
    let nextOrderId = 1000 + Math.floor(Math.random() * 9000);

    const detalles = Array.from(grouped.entries()).map(([provId, items]) => {
      const oid = nextOrderId++;
      return {
        orden_id: oid,
        proveedor_id: provId,
        proveedor_nombre: items[0].proveedor_nombre,
        items_count: items.length,
        total_cost: items.reduce((s, i) => s + i.costo_total, 0),
      };
    });

    const result: SendOrdersResult = {
      ordenes_creadas: detalles.length,
      ids: detalles.map(d => d.orden_id),
      detalles,
    };

    // Clear cart after sending
    this.cartSubject.next(null);

    // TODO: Replace with HTTP POST /api/v1/cart/send-orders
    return of(result).pipe(delay(500));
  }

  /** Get items grouped by supplier (for order splitting preview) */
  getItemsBySupplier(): Map<number, CartItem[]> {
    const cart = this.cartSubject.value;
    if (!cart) return new Map();

    const grouped = new Map<number, CartItem[]>();
    cart.items.forEach(item => {
      if (!grouped.has(item.proveedor_id)) {
        grouped.set(item.proveedor_id, []);
      }
      grouped.get(item.proveedor_id)!.push(item);
    });

    return grouped;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private createEmptyCart(): Cart {
    return {
      id: this.nextCartId++,
      items: [],
      estado: 'DRAFT',
      total_productos: 0,
      total_costo: 0,
      tiene_clase_c: false,
      proveedores_unicos: 0,
      creado_por_usuario_id: this.currentUserId,
      fecha_creacion: new Date(),
      fecha_ultima_modificacion: new Date(),
    };
  }

  private recalculateTotals(cart: Cart): Cart {
    const items = cart.items;
    const uniqueSuppliers = new Set(items.map(i => i.proveedor_id));

    return {
      ...cart,
      total_productos: items.length,
      total_costo: items.reduce((sum, i) => sum + i.costo_total, 0),
      tiene_clase_c: items.some(i => i.es_clase_c),
      proveedores_unicos: uniqueSuppliers.size,
    };
  }
}
