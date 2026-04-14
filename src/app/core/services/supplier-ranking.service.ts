import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ProveedorRanking {
  ranking: number;
  proveedor_id: number;
  proveedor_nombre: string;
  costo_real_neto: number;
  precio_lista: number;
  bonificaciones_total: number;
  kpi_score: number; // 0-100
  otif: number; // On-Time In-Full percentage
  lt_compliance: number; // Lead Time compliance percentage
  score_final_80_20: number; // Lower is better
  requiere_aprobacion: boolean; // Clase C flag
  bonificaciones_aplicadas: string[];
}

@Injectable({ providedIn: 'root' })
export class SupplierRankingService {
  private apiUrl = '/api/v1/suppliers/ranking';

  constructor() {}

  /**
   * Get ranked suppliers for a product/molecule
   * @param productoId Product ID or molecule ID
   * @returns Observable with ranked suppliers (sorted by 80/20 score)
   */
  getRanking(productoId: number): Observable<ProveedorRanking[]> {
    // TODO: Replace with actual HTTP call when backend is ready
    // const params = new HttpParams().set('producto_id', productoId);
    // return this.http.get<ProveedorRanking[]>(this.apiUrl, { params });
    
    return this._getMockRanking(productoId);
  }

  /**
   * Generate mock supplier ranking data for development
   */
  private _getMockRanking(productoId: number): Observable<ProveedorRanking[]> {
    const suppliers: ProveedorRanking[] = [
      {
        ranking: 1,
        proveedor_id: 101,
        proveedor_nombre: 'Droguería Coopidrogas S.A.',
        precio_lista: 1500,
        bonificaciones_total: 250,
        costo_real_neto: 1250,
        kpi_score: 92,
        otif: 95.5,
        lt_compliance: 88.5,
        score_final_80_20: 1268.4, // 80% cost + 20% KPI penalty
        requiere_aprobacion: productoId === 3, // Amoxicilina
        bonificaciones_aplicadas: ['8+2 promo', 'Volume discount 10%']
      },
      {
        ranking: 2,
        proveedor_id: 102,
        proveedor_nombre: 'Distribuidora La Cruz Verde S.A.S.',
        precio_lista: 1450,
        bonificaciones_total: 145,
        costo_real_neto: 1305,
        kpi_score: 85,
        otif: 89.0,
        lt_compliance: 81.0,
        score_final_80_20: 1329.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: ['Early payment 10%']
      },
      {
        ranking: 3,
        proveedor_id: 103,
        proveedor_nombre: 'Laboratorios Phoenix S.A.',
        precio_lista: 1600,
        bonificaciones_total: 160,
        costo_real_neto: 1440,
        kpi_score: 68,
        otif: 72.0,
        lt_compliance: 64.0,
        score_final_80_20: 1536.0, // Poor KPI increases final score
        requiere_aprobacion: false,
        bonificaciones_aplicadas: ['Volume discount 10%']
      },
      {
        ranking: 4,
        proveedor_id: 104,
        proveedor_nombre: 'Farmaenlace Colombia Ltda.',
        precio_lista: 1350,
        bonificaciones_total: 0,
        costo_real_neto: 1350,
        kpi_score: 78,
        otif: 82.0,
        lt_compliance: 74.0,
        score_final_80_20: 1394.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: []
      }
    ];

    return of(suppliers);
  }
}
