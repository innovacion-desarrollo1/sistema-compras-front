import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
  cantidad_sugerida: number;
  necesita_orden: boolean;
}

/** Resultado del ranking: proveedores + la cantidad sugerida OFICIAL del producto. */
export interface RankingResult {
  proveedores: ProveedorRanking[];
  cantidad_sugerida: number;
  necesita_orden: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupplierRankingService {
  private readonly apiUrl = '/api/v1/suggestions/calculate';

  constructor(private http: HttpClient) {}

  getRanking(productoId: number | string, empresa: string = 'DUANA'): Observable<RankingResult> {
    // Sin fallback a mock: los errores se propagan para que la UI muestre la causa real.
    // La cantidad sugerida es del producto (no por proveedor): el backend la calcula por familia.
    return this.http.post<CalculateResponse>(this.apiUrl, {
      producto_id: String(productoId),
      empresa,
      id_region: 1,
    }).pipe(
      map(response => ({
        proveedores: response.proveedores,
        cantidad_sugerida: response.cantidad_sugerida,
        necesita_orden: response.necesita_orden,
      })),
    );
  }
}

