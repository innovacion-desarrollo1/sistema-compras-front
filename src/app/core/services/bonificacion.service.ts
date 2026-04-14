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
  es_permanente?: boolean; // true si no tiene fecha de vencimiento
  vigente?: boolean; // Alias for es_vigente (compatibility)
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
    // Proveedor 101: Droguería Coopidrogas (TOP TIER)
    {
      id: 1,
      proveedor_id: 101,
      proveedor_nombre: 'Droguería Coopidrogas S.A.',
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
      proveedor_id: 101,
      proveedor_nombre: 'Droguería Coopidrogas S.A.',
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
    // Proveedor 102: La Cruz Verde
    {
      id: 3,
      proveedor_id: 102,
      proveedor_nombre: 'Distribuidora La Cruz Verde S.A.S.',
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
      proveedor_id: 102,
      proveedor_nombre: 'Distribuidora La Cruz Verde S.A.S.',
      molecula_id: 1,
      tipo: 'DESCUENTO_FIJO',
      valor: 500,
      descripcion: '$500 descuento por primera orden del mes',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-04-30'),
      es_vigente: true
    },
    // Proveedor 3: Laboratorios Phoenix
    {
      id: 5,
      proveedor_id: 103,
      proveedor_nombre: 'Laboratorios Phoenix S.A.',
      molecula_id: 1,
      tipo: 'PORCENTAJE',
      valor: 10,
      descripcion: '10% descuento de lealtad (cliente frecuente)',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null,
      es_vigente: true
    },
    // Proveedor 4: Farmaenlace - sin bonificaciones visibles
    // Proveedor 5: Distribuciones Medifar - liquidación agresiva
    {
      id: 6,
      proveedor_id: 105,
      proveedor_nombre: 'Distribuciones Medifar S.A.S.',
      molecula_id: 1,
      tipo: 'PORCENTAJE',
      valor: 20,
      descripcion: 'Liquidación de inventario 20%',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-04-30'),
      es_vigente: true
    },
    {
      id: 7,
      proveedor_id: 105,
      proveedor_nombre: 'Distribuciones Medifar S.A.S.',
      molecula_id: 1,
      tipo: 'UNIDADES_GRATIS',
      valor: 0,
      descripcion: 'Compra 5, lleva 7 (promoción flash)',
      fecha_inicio: new Date('2026-04-10'),
      fecha_fin: new Date('2026-04-20'),
      es_vigente: true,
      unidades_compradas: 5,
      unidades_gratis: 2
    },
    // Proveedor 6: Droguerías Pasteur - pocas bonificaciones
    {
      id: 8,
      proveedor_id: 106,
      proveedor_nombre: 'Droguerías Pasteur Ltda.',
      molecula_id: 1,
      tipo: 'DESCUENTO_FIJO',
      valor: 100,
      descripcion: '$100 descuento por pedido mayor a 1000 unidades',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null,
      es_vigente: true
    },
    // Proveedor 7: Baxter - bonificaciones premium
    {
      id: 9,
      proveedor_id: 107,
      proveedor_nombre: 'Laboratorios Baxter Colombia S.A.',
      molecula_id: 1,
      tipo: 'PORCENTAJE',
      valor: 15,
      descripcion: '15% descuento Q2 2026 (campaña semestral)',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-06-30'),
      es_vigente: true
    },
    {
      id: 10,
      proveedor_id: 107,
      proveedor_nombre: 'Laboratorios Baxter Colombia S.A.',
      molecula_id: 1,
      tipo: 'UNIDADES_GRATIS',
      valor: 0,
      descripcion: 'Compra 20, lleva 24 (bonificación mayorista)',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null,
      es_vigente: true,
      unidades_compradas: 20,
      unidades_gratis: 4
    },
    // Proveedor 8: Farmacias Económicas - sin bonificaciones
    
    // === BONIFICACIONES PARA OTROS PRODUCTOS ===
    
    // Ibuprofeno (id: 2)
    {
      id: 11,
      proveedor_id: 101,
      proveedor_nombre: 'Droguería Coopidrogas S.A.',
      molecula_id: 2,
      tipo: 'PORCENTAJE',
      valor: 12,
      descripcion: '12% descuento por volumen',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: new Date('2026-12-31'),
      es_vigente: true
    },
    {
      id: 12,
      proveedor_id: 102,
      proveedor_nombre: 'Distribuidora La Cruz Verde S.A.S.',
      molecula_id: 2,
      tipo: 'UNIDADES_GRATIS',
      valor: 0,
      descripcion: 'Compra 12, lleva 14',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-05-31'),
      es_vigente: true,
      unidades_compradas: 12,
      unidades_gratis: 2
    },
    
    // Amoxicilina (id: 3) - Clase C
    {
      id: 13,
      proveedor_id: 101,
      proveedor_nombre: 'Droguería Coopidrogas S.A.',
      molecula_id: 3,
      tipo: 'PORCENTAJE',
      valor: 8,
      descripcion: '8% descuento corporativo',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null,
      es_vigente: true
    },
    
    // Metformina (id: 4)
    {
      id: 14,
      proveedor_id: 101,
      proveedor_nombre: 'Droguería Coopidrogas S.A.',
      molecula_id: 4,
      tipo: 'DESCUENTO_FIJO',
      valor: 200,
      descripcion: '$200 descuento por pedido >500 unidades',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: null,
      es_vigente: true
    },
    {
      id: 15,
      proveedor_id: 105,
      proveedor_nombre: 'Distribuciones Medifar S.A.S.',
      molecula_id: 4,
      tipo: 'PORCENTAJE',
      valor: 25,
      descripcion: 'Liquidación 25% - últimas unidades',
      fecha_inicio: new Date('2026-04-01'),
      fecha_fin: new Date('2026-04-15'),
      es_vigente: true
    }
  ];

  // Get all bonifications (useful for management UI)
  getBonificaciones(): Observable<Bonificacion[]> {
    return of(this.mockBonificaciones);
  }

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
