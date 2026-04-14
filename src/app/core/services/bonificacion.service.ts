import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';

export interface Bonificacion {
  id?: number;
  proveedor_id: number;
  proveedor_nombre: string;
  molecula_id: number;
  tipo: 'PORCENTAJE' | 'UNIDADES_GRATIS' | 'DESCUENTO_FIJO';
  valor: number; // % if PORCENTAJE, units if UNIDADES_GRATIS, $ if DESCUENTO_FIJO
  descripcion: string;
  fecha_inicio: Date;
  fecha_fin: Date | null; // null = permanent
  es_vigente: boolean;
  aplicada_a_orden?: boolean; // UI state: is this bonification selected for current order?
  // For "compra X, lleva Y" type bonifications
  unidades_compradas?: number;
  unidades_gratis?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BonificacionService {
  // Store applied bonifications for current order (UI state)
  private appliedBonificationsSubject = new BehaviorSubject<Bonificacion[]>([]);
  public appliedBonifications$ = this.appliedBonificationsSubject.asObservable();

  private mockBonificaciones: Bonificacion[] = [
    // Proveedor 1: Droguería del Norte
    {
      id: 1,
      proveedor_id: 1,
      proveedor_nombre: 'Droguería del Norte SA',
      molecula_id: 1, // Acetaminofen
      tipo: 'PORCENTAJE',
      valor: 10,
      descripcion: '10% descuento por volumen (pedidos > 500 unidades)',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: new Date('2026-06-30'),
      es_vigente: true
    },
    {
      id: 2,
      proveedor_id: 1,
      proveedor_nombre: 'Droguería del Norte SA',
      molecula_id: 1,
      tipo: 'UNIDADES_GRATIS',
      valor: 0,
      descripcion: 'Compra 10, lleva 12 (promoción trimestral)',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-06-30'),
      es_vigente: true,
      unidades_compradas: 10,
      unidades_gratis: 2
    },
    // Proveedor 2: Farmacias Unidas
    {
      id: 3,
      proveedor_id: 2,
      proveedor_nombre: 'Farmacias Unidas Ltda',
      molecula_id: 1,
      tipo: 'PORCENTAJE',
      valor: 8,
      descripcion: '8% descuento por pago anticipado',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null, // Permanente
      es_vigente: true
    },
    {
      id: 4,
      proveedor_id: 2,
      proveedor_nombre: 'Farmacias Unidas Ltda',
      molecula_id: 1,
      tipo: 'DESCUENTO_FIJO',
      valor: 500,
      descripcion: '$500 descuento por primera orden del mes',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-04-30'),
      es_vigente: true
    },
    // Proveedor 3: Laboratorios Andinos
    {
      id: 5,
      proveedor_id: 3,
      proveedor_nombre: 'Laboratorios Andinos SAS',
      molecula_id: 1,
      tipo: 'PORCENTAJE',
      valor: 5,
      descripcion: '5% descuento de lealtad (cliente frecuente)',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null,
      es_vigente: true
    }
  ];

  // Get active bonifications for a supplier and molecule
  getBonificacionesVigentes(proveedor_id: number, molecula_id: number): Observable<Bonificacion[]> {
    const vigentes = this.mockBonificaciones.filter(b =>
      b.proveedor_id === proveedor_id &&
      b.molecula_id === molecula_id &&
      b.es_vigente &&
      this._isDateValid(b.fecha_inicio, b.fecha_fin)
    );
    return of(vigentes);
  }

  // Create new bonification (persists to mock array for development)
  createBonificacion(bonificacion: Omit<Bonificacion, 'id'>): Observable<Bonificacion> {
    const newId = Math.max(...this.mockBonificaciones.map(b => b.id || 0)) + 1;
    const newBonificacion: Bonificacion = {
      ...bonificacion,
      id: newId,
      es_vigente: true
    };
    this.mockBonificaciones.push(newBonificacion);
    return of(newBonificacion);
  }

  // Apply bonification to current order (UI state)
  applyBonificacion(bonificacion: Bonificacion): void {
    const current = this.appliedBonificationsSubject.value;
    // Check if already applied
    if (!current.find(b => b.id === bonificacion.id)) {
      bonificacion.aplicada_a_orden = true;
      this.appliedBonificationsSubject.next([...current, bonificacion]);
    }
  }

  // Remove bonification from current order
  removeBonificacion(bonificacionId: number): void {
    const current = this.appliedBonificationsSubject.value;
    const updated = current.filter(b => b.id !== bonificacionId);
    this.appliedBonificationsSubject.next(updated);
  }

  // Clear all applied bonifications (reset)
  clearAppliedBonificaciones(): void {
    this.appliedBonificationsSubject.next([]);
  }

  // Get applied bonifications for current order
  getAppliedBonificaciones(): Bonificacion[] {
    return this.appliedBonificationsSubject.value;
  }

  // Calculate total discount from applied bonifications
  calculateTotalDiscount(precio_lista: number, cantidad: number): number {
    const applied = this.appliedBonificationsSubject.value;
    let descuento_total = 0;

    for (const bonif of applied) {
      switch (bonif.tipo) {
        case 'PORCENTAJE':
          descuento_total += (precio_lista * cantidad) * (bonif.valor / 100);
          break;
        case 'UNIDADES_GRATIS':
          if (bonif.unidades_compradas && bonif.unidades_gratis) {
            const cycles = Math.floor(cantidad / bonif.unidades_compradas);
            const unidades_gratis_total = cycles * bonif.unidades_gratis;
            descuento_total += unidades_gratis_total * precio_lista;
          }
          break;
        case 'DESCUENTO_FIJO':
          descuento_total += bonif.valor;
          break;
      }
    }

    return descuento_total;
  }

  private _isDateValid(fecha_inicio: Date, fecha_fin: Date | null): boolean {
    const now = new Date();
    if (fecha_inicio > now) return false;
    if (fecha_fin && fecha_fin < now) return false;
    return true;
  }
}
