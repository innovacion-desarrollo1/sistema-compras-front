import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface CostScenario {
  scenario: string; // e.g., "-30%", "0% (Base)", "+20%"
  cantidad: number;
  costo_unitario: number;
  bonificacion_aplicada: number;
  costo_total: number;
  is_base: boolean;
  bonification_tier_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class CostSimulationService {
  private apiUrl = '/api/v1/cost-simulation';

  constructor() {}

  /**
   * Get 7 cost scenarios for quantity variations (±30/20/10/0%)
   * @param productoId Product ID
   * @param baseQty Base suggested quantity
   * @param proveedorId Supplier ID
   * @returns Observable with 7 cost scenarios
   */
  getSimulation(productoId: number, baseQty: number, proveedorId: number): Observable<CostScenario[]> {
    // TODO: Replace with actual HTTP call when backend is ready
    // const params = new HttpParams()
    //   .set('producto_id', productoId)
    //   .set('cantidad_base', baseQty)
    //   .set('proveedor_id', proveedorId);
    // return this.http.get<CostScenario[]>(this.apiUrl, { params });
    
    return this._getMockSimulation(productoId, baseQty, proveedorId).pipe(delay(200));
  }

  /**
   * Generate mock simulation data for development
   */
  private _getMockSimulation(productoId: number, baseQty: number, proveedorId: number): Observable<CostScenario[]> {
    const variations = [-0.30, -0.20, -0.10, 0, +0.10, +0.20, +0.30];
    const baseUnitCost = 1250; // Mock base unit cost
    const bonificationThreshold = 100; // Volume discount at 100+ units
    
    const scenarios: CostScenario[] = variations.map(v => {
      const cantidad = Math.round(baseQty * (1 + v));
      
      // Simulate bonification logic: 10% discount for orders >= threshold
      const bonification_tier_active = cantidad >= bonificationThreshold;
      const bonificacion_aplicada = bonification_tier_active ? 10 : 0;
      const costo_unitario = baseUnitCost * (1 - bonificacion_aplicada / 100);
      const costo_total = cantidad * costo_unitario;
      
      return {
        scenario: v === 0 ? '0% (Base)' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`,
        cantidad,
        costo_unitario,
        bonificacion_aplicada,
        costo_total,
        is_base: v === 0,
        bonification_tier_active
      };
    });

    return of(scenarios);
  }
}
