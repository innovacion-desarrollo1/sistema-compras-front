import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Bonificacion } from './bonificacion.service';

export interface ProveedorRanking {
  ranking: number;
  proveedor_id: number;
  proveedor_nombre: string;

  // Costos
  precio_lista: number;
  bonificaciones_total: number;
  costo_real_neto: number;
  costo_unitario: number;
  ultimo_costo: number;

  // Análisis de costos
  costo_promedio_inventario: number;
  costo_promedio_ponderado: number;
  esta_mas_caro_promedio: boolean;

  // KPIs
  kpi_score: number;
  kpi_estimado: boolean;
  entregas_completas_tiempo: number;
  cumplimiento_plazo_entrega: number;

  // Scoring
  score_final_80_20: number | null;
  requiere_aprobacion: boolean;
  bonificaciones_aplicadas: Bonificacion[];

  precio_disponible: boolean;
  mensaje_alerta: string | null;
}

interface CalculateResponse {
  proveedores: ProveedorRanking[];
}

@Injectable({ providedIn: 'root' })
export class SupplierRankingService {
  private readonly apiUrl = '/api/v1/suggestions/calculate';

  constructor(private http: HttpClient) {}

  getRanking(productoId: number | string, empresa: string = 'DUANA'): Observable<ProveedorRanking[]> {
    return this.http.post<CalculateResponse>(this.apiUrl, {
      producto_id: String(productoId),
      empresa,
      id_region: 1,
    }).pipe(
      map(response => response.proveedores),
      map(items => items.length > 0 ? items : MOCK_SUPPLIERS),
      catchError(() => of(MOCK_SUPPLIERS)),
    );
  }
}

const MOCK_SUPPLIERS: ProveedorRanking[] = [
  {
    ranking: 1,
    proveedor_id: 101,
    proveedor_nombre: 'Coopidrogas S.A.',
    precio_lista: 85000,
    bonificaciones_total: 8500,
    costo_real_neto: 76500,
    costo_unitario: 76500,
    ultimo_costo: 78000,
    costo_promedio_inventario: 77200,
    costo_promedio_ponderado: 76800,
    esta_mas_caro_promedio: false,
    kpi_score: 91.5,
    kpi_estimado: false,
    entregas_completas_tiempo: 94,
    cumplimiento_plazo_entrega: 89,
    score_final_80_20: 12.4,
    requiere_aprobacion: false,
    bonificaciones_aplicadas: [],
    precio_disponible: true,
    mensaje_alerta: null,
  },
  {
    ranking: 2,
    proveedor_id: 102,
    proveedor_nombre: 'Audifarma S.A.',
    precio_lista: 87500,
    bonificaciones_total: 4375,
    costo_real_neto: 83125,
    costo_unitario: 83125,
    ultimo_costo: 85000,
    costo_promedio_inventario: 84000,
    costo_promedio_ponderado: 83500,
    esta_mas_caro_promedio: true,
    kpi_score: 85.0,
    kpi_estimado: false,
    entregas_completas_tiempo: 88,
    cumplimiento_plazo_entrega: 82,
    score_final_80_20: 18.7,
    requiere_aprobacion: false,
    bonificaciones_aplicadas: [],
    precio_disponible: true,
    mensaje_alerta: null,
  },
  {
    ranking: 3,
    proveedor_id: 103,
    proveedor_nombre: 'Distribuidora Médica del Valle',
    precio_lista: 92000,
    bonificaciones_total: 0,
    costo_real_neto: 92000,
    costo_unitario: 92000,
    ultimo_costo: 91000,
    costo_promedio_inventario: 91500,
    costo_promedio_ponderado: 91800,
    esta_mas_caro_promedio: true,
    kpi_score: 78.0,
    kpi_estimado: true,
    entregas_completas_tiempo: 80,
    cumplimiento_plazo_entrega: 76,
    score_final_80_20: 24.1,
    requiere_aprobacion: true,
    bonificaciones_aplicadas: [],
    precio_disponible: true,
    mensaje_alerta: 'KPIs estimados — sin historial completo',
  },
];
