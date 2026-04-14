import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Bonificacion } from './bonificacion.service';

export interface ProveedorRanking {
  ranking: number;
  proveedor_id: number;
  proveedor_nombre: string;
  
  // Costos
  precio_lista: number;
  bonificaciones_total: number;
  costo_real_neto: number; // Costo final con bonificaciones
  costo_unitario: number; // Costo por unidad
  ultimo_costo: number; // Último costo de compra registrado
  
  // Análisis de costos
  costo_promedio_inventario: number; // Promedio de todos los productos con este ID
  costo_promedio_ponderado: number; // Promedio ponderado de precio adquirido
  esta_mas_caro_promedio: boolean; // Semaforización: TRUE si ofrece más caro del promedio
  
  // KPIs simplificados (sin términos técnicos)
  kpi_score: number; // 0-100
  entregas_completas_tiempo: number; // Porcentaje de entregas completas y a tiempo (antes OTIF)
  cumplimiento_plazo_entrega: number; // Cumplimiento del plazo de entrega (antes LT compliance)
  
  score_final_80_20: number; // Lower is better
  requiere_aprobacion: boolean; // Clase C flag
  bonificaciones_aplicadas: Bonificacion[]; // Bonificaciones activas para este proveedor-producto
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
    // Valores base para análisis de costos (simularían venir de la DB)
    const costoPromedioInventario = 1200; // Promedio de todos los productos por este ID
    const costoPromedioponderado = 1250; // Promedio ponderado de compras previas
    
    // Base de proveedores variados
    const allSuppliers: ProveedorRanking[] = [
      // TOP TIER - Excelentes KPIs, precios competitivos
      {
        ranking: 1,
        proveedor_id: 101,
        proveedor_nombre: 'Droguería Coopidrogas S.A.',
        precio_lista: 1500,
        bonificaciones_total: 250,
        costo_real_neto: 1250,
        costo_unitario: 1250,
        ultimo_costo: 1220,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: false, // 1250 = promedio
        kpi_score: 92,
        entregas_completas_tiempo: 95.5,
        cumplimiento_plazo_entrega: 88.5,
        score_final_80_20: 1268.4,
        requiere_aprobacion: [3, 7, 9, 10, 13].includes(productoId),
        bonificaciones_aplicadas: [
          {
            id: 1,
            proveedor_id: 101,
            proveedor_nombre: 'Droguería Coopidrogas S.A.',
            molecula_id: productoId,
            tipo: 'UNIDADES_GRATIS',
            valor: 0,
            descripcion: 'Compra 8, lleva 10 (8+2 gratis)',
            unidades_compradas: 8,
            unidades_gratis: 2,
            fecha_inicio: new Date('2026-01-01'),
            fecha_fin: null,
            es_vigente: true,
            es_permanente: true
          },
          {
            id: 2,
            proveedor_id: 101,
            proveedor_nombre: 'Droguería Coopidrogas S.A.',
            molecula_id: productoId,
            tipo: 'PORCENTAJE',
            valor: 10,
            descripcion: 'Descuento por volumen 10% (>100 unidades)',
            fecha_inicio: new Date('2026-01-01'),
            fecha_fin: null,
            es_vigente: true,
            es_permanente: true
          }
        ]
      },
      {
        ranking: 2,
        proveedor_id: 102,
        proveedor_nombre: 'Distribuidora La Cruz Verde S.A.S.',
        precio_lista: 1450,
        bonificaciones_total: 145,
        costo_real_neto: 1305,
        costo_unitario: 1305,
        ultimo_costo: 1280,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: true, // 1305 > 1250
        kpi_score: 85,
        entregas_completas_tiempo: 89.0,
        cumplimiento_plazo_entrega: 81.0,
        score_final_80_20: 1329.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: [
          {
            id: 3,
            proveedor_id: 102,
            proveedor_nombre: 'Distribuidora La Cruz Verde S.A.S.',
            molecula_id: productoId,
            tipo: 'PORCENTAJE',
            valor: 8,
            descripcion: '8% descuento por pago anticipado',
            fecha_inicio: new Date('2026-01-01'),
            fecha_fin: null,
            es_vigente: true,
            es_permanente: true
          }
        ]
      },
      // MID TIER - KPIs medios, precios variados
      {
        ranking: 3,
        proveedor_id: 103,
        proveedor_nombre: 'Laboratorios Phoenix S.A.',
        precio_lista: 1600,
        bonificaciones_total: 160,
        costo_real_neto: 1440,
        costo_unitario: 1440,
        ultimo_costo: 1420,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: true, // 1440 > 1250
        kpi_score: 68,
        entregas_completas_tiempo: 72.0,
        cumplimiento_plazo_entrega: 64.0,
        score_final_80_20: 1536.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: [
          {
            id: 5,
            proveedor_id: 103,
            proveedor_nombre: 'Laboratorios Phoenix S.A.',
            molecula_id: productoId,
            tipo: 'PORCENTAJE',
            valor: 10,
            descripcion: '10% descuento de lealtad (cliente frecuente)',
            fecha_inicio: new Date('2026-01-01'),
            fecha_fin: null,
            es_vigente: true,
            es_permanente: true
          }
        ]
      },
      {
        ranking: 4,
        proveedor_id: 104,
        proveedor_nombre: 'Farmaenlace Colombia Ltda.',
        precio_lista: 1350,
        bonificaciones_total: 0,
        costo_real_neto: 1350,
        costo_unitario: 1350,
        ultimo_costo: 1330,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: true, // 1350 > 1250
        kpi_score: 78,
        entregas_completas_tiempo: 82.0,
        cumplimiento_plazo_entrega: 74.0,
        score_final_80_20: 1394.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: []
      },
      // LOW TIER - KPIs bajos pero precios muy competitivos
      {
        ranking: 5,
        proveedor_id: 105,
        proveedor_nombre: 'Distribuciones Medifar S.A.S.',
        precio_lista: 1100,
        bonificaciones_total: 220,
        costo_real_neto: 880,
        costo_unitario: 880,
        ultimo_costo: 900,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: false, // 880 < 1250 ✅ MUY BARATO
        kpi_score: 58,
        entregas_completas_tiempo: 62.0,
        cumplimiento_plazo_entrega: 54.0,
        score_final_80_20: 1012.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: [
          {
            id: 6,
            proveedor_id: 105,
            proveedor_nombre: 'Distribuciones Medifar S.A.S.',
            molecula_id: productoId,
            tipo: 'PORCENTAJE',
            valor: 20,
            descripcion: 'Liquidación de inventario 20%',
            fecha_inicio: new Date('2026-04-01'),
            fecha_fin: new Date('2026-04-30'),
            es_vigente: true,
            es_permanente: false
          }
        ]
      },
      {
        ranking: 6,
        proveedor_id: 106,
        proveedor_nombre: 'Droguerías Pasteur Ltda.',
        precio_lista: 1800,
        bonificaciones_total: 90,
        costo_real_neto: 1710,
        costo_unitario: 1710,
        ultimo_costo: 1695,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: true, // 1710 > 1250 ⚠️ MUY CARO
        kpi_score: 94,
        entregas_completas_tiempo: 97.0,
        cumplimiento_plazo_entrega: 91.0,
        score_final_80_20: 1722.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: [
          {
            id: 13,
            proveedor_id: 106,
            proveedor_nombre: 'Droguerías Pasteur Ltda.',
            molecula_id: productoId,
            tipo: 'PORCENTAJE',
            valor: 5,
            descripcion: 'Descuento corporativo 5%',
            fecha_inicio: new Date('2026-01-01'),
            fecha_fin: null,
            es_vigente: true,
            es_permanente: true
          }
        ]
      },
      // PREMIUM - Excelentes KPIs, precios altos
      {
        ranking: 7,
        proveedor_id: 107,
        proveedor_nombre: 'Laboratorios Baxter Colombia S.A.',
        precio_lista: 2200,
        bonificaciones_total: 330,
        costo_real_neto: 1870,
        costo_unitario: 1870,
        ultimo_costo: 1850,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: true, // 1870 > 1250 ⚠️ PREMIUM
        kpi_score: 96,
        entregas_completas_tiempo: 98.5,
        cumplimiento_plazo_entrega: 93.5,
        score_final_80_20: 1872.8,
        requiere_aprobacion: [10, 13].includes(productoId),
        bonificaciones_aplicadas: [
          {
            id: 14,
            proveedor_id: 107,
            proveedor_nombre: 'Laboratorios Baxter Colombia S.A.',
            molecula_id: productoId,
            tipo: 'PORCENTAJE',
            valor: 15,
            descripcion: 'Promoción Q2 2026 - 15%',
            fecha_inicio: new Date('2026-04-01'),
            fecha_fin: new Date('2026-06-30'),
            es_vigente: true,
            es_permanente: false
          }
        ]
      },
      // BUDGET - Precio muy bajo, KPIs muy malos
      {
        ranking: 8,
        proveedor_id: 108,
        proveedor_nombre: 'Farmacias Económicas del Valle',
        precio_lista: 950,
        bonificaciones_total: 0,
        costo_real_neto: 950,
        costo_unitario: 950,
        ultimo_costo: 970,
        costo_promedio_inventario: costoPromedioInventario,
        costo_promedio_ponderado: costoPromedioponderado,
        esta_mas_caro_promedio: false, // 950 < 1250 ✅ MUY BARATO
        kpi_score: 42,
        entregas_completas_tiempo: 48.0,
        cumplimiento_plazo_entrega: 36.0,
        score_final_80_20: 1190.0,
        requiere_aprobacion: false,
        bonificaciones_aplicadas: []
      }
    ];

    // Variar proveedores según ID de producto para realismo
    let suppliers: ProveedorRanking[];
    
    if (productoId <= 5) {
      // Productos comunes: todos los proveedores
      suppliers = allSuppliers;
    } else if (productoId <= 10) {
      // Productos medios: 6 proveedores
      suppliers = allSuppliers.slice(0, 6);
    } else if (productoId <= 15) {
      // Productos especiales: 5 proveedores
      suppliers = allSuppliers.filter((_, i) => i !== 3 && i !== 7).slice(0, 5);
    } else {
      // Productos raros: 4 proveedores premium
      suppliers = [allSuppliers[0], allSuppliers[1], allSuppliers[5], allSuppliers[6]];
    }

    // Re-rank based on score
    suppliers.sort((a, b) => a.score_final_80_20 - b.score_final_80_20);
    suppliers.forEach((s, i) => s.ranking = i + 1);

    return of(suppliers);
  }
}
