import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  OrdenCompra,
  TraceabilityKpis,
  OcFiltros,
  Factura,
  Novedad,
} from '../models/traceability.models';

/**
 * TraceabilityService — EP-003 Módulo 3
 *
 * Capa de datos con forma real de API. Los métodos devuelven Observable<T>
 * con datos mock. El contrato HTTP permanece estable para el backend real;
 * solo cambiar el bloque de datos internos.
 *
 * API shape esperada:
 *   GET /api/v1/traceability/ordenes          → OrdenCompra[]
 *   GET /api/v1/traceability/ordenes/:id      → OrdenCompra
 *   GET /api/v1/traceability/kpis             → TraceabilityKpis
 *   PATCH /api/v1/traceability/ordenes/:id/estado  → OrdenCompra
 */
@Injectable({ providedIn: 'root' })
export class TraceabilityService {

  // ─── Mock data ────────────────────────────────────────────────────────────

  private readonly MOCK_OCS: OrdenCompra[] = [
    {
      id: 'OC-2025-001',
      numero_oc: 'OC-2025-001',
      estado: 'ACTIVA',
      proveedor_id: 'P001',
      proveedor_nombre: 'Laboratorios Procaps S.A.',
      producto_id: 'SDR-0042',
      producto_nombre: 'Amoxicilina 500mg Cápsulas',
      molecula: 'Amoxicilina',
      familia: 2,
      cantidad_total: 5000,
      cantidad_recibida: 3000,
      unidad: 'unidades',
      monto_total: 12_500_000,
      fecha_creacion: new Date('2025-06-01'),
      fecha_emision: new Date('2025-06-03'),
      fecha_entrega_esperada: new Date('2025-07-10'),
      otif_pct: 78,
      es_clase_c: false,
      facturas: [
        {
          id: 'F-001',
          numero_factura: 'FAC-2025-3841',
          oc_id: 'OC-2025-001',
          estado: 'RECIBIDA_TOTAL',
          fecha_emision: new Date('2025-06-10'),
          fecha_entrega_esperada: new Date('2025-06-20'),
          fecha_entrega_real: new Date('2025-06-21'),
          proveedor_id: 'P001',
          proveedor_nombre: 'Laboratorios Procaps S.A.',
          monto_total: 7_500_000,
          lineas: [
            {
              producto_id: 'SDR-0042',
              producto_nombre: 'Amoxicilina 500mg Cápsulas',
              cantidad_pedida: 3000,
              cantidad_recibida: 3000,
              unidad: 'unidades',
              lote: 'LOT-AMX-240601',
              fecha_vencimiento: new Date('2026-12-31'),
            },
          ],
          novedades: [],
        },
        {
          id: 'F-002',
          numero_factura: 'FAC-2025-3942',
          oc_id: 'OC-2025-001',
          estado: 'EN_TRANSITO',
          fecha_emision: new Date('2025-06-28'),
          fecha_entrega_esperada: new Date('2025-07-10'),
          proveedor_id: 'P001',
          proveedor_nombre: 'Laboratorios Procaps S.A.',
          monto_total: 5_000_000,
          lineas: [
            {
              producto_id: 'SDR-0042',
              producto_nombre: 'Amoxicilina 500mg Cápsulas',
              cantidad_pedida: 2000,
              cantidad_recibida: 0,
              unidad: 'unidades',
            },
          ],
          novedades: [
            {
              id: 1,
              oc_id: 'OC-2025-001',
              tipo: 'RETRASO',
              severidad: 'ALTA',
              descripcion: 'Proveedor reporta retraso por escasez de materia prima. Nueva fecha estimada: 15 julio.',
              fecha_reporte: new Date('2025-07-05'),
              resuelta: false,
              fuente: 'PROVEEDOR',
            },
          ],
        },
      ],
      novedades: [
        {
          id: 1,
          oc_id: 'OC-2025-001',
          tipo: 'RETRASO',
          severidad: 'ALTA',
          descripcion: 'Proveedor reporta retraso por escasez de materia prima. Nueva fecha estimada: 15 julio.',
          fecha_reporte: new Date('2025-07-05'),
          resuelta: false,
          fuente: 'PROVEEDOR',
        },
      ],
      audit_trail: [
        { estado_anterior: null, estado_nuevo: 'BORRADOR', fecha: new Date('2025-06-01'), usuario: 'Maria Rojas' },
        { estado_anterior: 'BORRADOR', estado_nuevo: 'VALIDADA', fecha: new Date('2025-06-02'), usuario: 'Carlos Pérez', comentario: 'Revisión de precios OK' },
        { estado_anterior: 'VALIDADA', estado_nuevo: 'EMITIDA', fecha: new Date('2025-06-03'), usuario: 'Carlos Pérez' },
        { estado_anterior: 'EMITIDA', estado_nuevo: 'ACTIVA', fecha: new Date('2025-06-10'), usuario: 'Sistema', comentario: 'Primera factura recibida' },
      ],
    },
    {
      id: 'OC-2025-002',
      numero_oc: 'OC-2025-002',
      estado: 'ACTIVA',
      proveedor_id: 'P002',
      proveedor_nombre: 'Bayer S.A. Colombia',
      producto_id: 'SDR-0118',
      producto_nombre: 'Ciprofloxacino 500mg Tabletas',
      molecula: 'Ciprofloxacino',
      familia: 1,
      cantidad_total: 2000,
      cantidad_recibida: 500,
      unidad: 'unidades',
      monto_total: 8_400_000,
      fecha_creacion: new Date('2025-06-10'),
      fecha_emision: new Date('2025-06-12'),
      fecha_entrega_esperada: new Date('2025-07-05'),
      otif_pct: 55,
      es_clase_c: true,
      aprobado_por: 'Director General',
      facturas: [
        {
          id: 'F-003',
          numero_factura: 'FAC-2025-4120',
          oc_id: 'OC-2025-002',
          estado: 'RECIBIDA_PARCIAL',
          fecha_emision: new Date('2025-06-20'),
          fecha_entrega_esperada: new Date('2025-07-05'),
          fecha_entrega_real: new Date('2025-07-08'),
          proveedor_id: 'P002',
          proveedor_nombre: 'Bayer S.A. Colombia',
          monto_total: 8_400_000,
          lineas: [
            {
              producto_id: 'SDR-0118',
              producto_nombre: 'Ciprofloxacino 500mg Tabletas',
              cantidad_pedida: 2000,
              cantidad_recibida: 500,
              unidad: 'unidades',
              lote: 'LOT-CIP-240620',
              fecha_vencimiento: new Date('2027-03-15'),
            },
          ],
          novedades: [
            {
              id: 2,
              oc_id: 'OC-2025-002',
              tipo: 'ENTREGA_PARCIAL',
              severidad: 'CRITICA',
              descripcion: 'Solo se recibieron 500 de 2.000 unidades. Proveedor no confirmó fecha para el saldo.',
              fecha_reporte: new Date('2025-07-08'),
              resuelta: false,
              fuente: 'SISTEMA',
            },
          ],
        },
      ],
      novedades: [
        {
          id: 2,
          oc_id: 'OC-2025-002',
          tipo: 'ENTREGA_PARCIAL',
          severidad: 'CRITICA',
          descripcion: 'Solo se recibieron 500 de 2.000 unidades. Proveedor no confirmó fecha para el saldo.',
          fecha_reporte: new Date('2025-07-08'),
          resuelta: false,
          fuente: 'SISTEMA',
        },
      ],
      audit_trail: [
        { estado_anterior: null, estado_nuevo: 'BORRADOR', fecha: new Date('2025-06-10'), usuario: 'Maria Rojas' },
        { estado_anterior: 'BORRADOR', estado_nuevo: 'VALIDADA', fecha: new Date('2025-06-11'), usuario: 'Carlos Pérez' },
        { estado_anterior: 'VALIDADA', estado_nuevo: 'EMITIDA', fecha: new Date('2025-06-12'), usuario: 'Carlos Pérez' },
        { estado_anterior: 'EMITIDA', estado_nuevo: 'ACTIVA', fecha: new Date('2025-07-08'), usuario: 'Sistema', comentario: 'Entrega parcial registrada' },
      ],
    },
    {
      id: 'OC-2025-003',
      numero_oc: 'OC-2025-003',
      estado: 'CERRADA',
      proveedor_id: 'P003',
      proveedor_nombre: 'Tecnoquímicas S.A.',
      producto_id: 'SDR-0205',
      producto_nombre: 'Metformina 850mg Tabletas',
      molecula: 'Metformina',
      familia: 3,
      cantidad_total: 10000,
      cantidad_recibida: 10000,
      unidad: 'unidades',
      monto_total: 3_200_000,
      fecha_creacion: new Date('2025-05-15'),
      fecha_emision: new Date('2025-05-16'),
      fecha_entrega_esperada: new Date('2025-06-15'),
      fecha_cierre: new Date('2025-06-14'),
      otif_pct: 100,
      es_clase_c: false,
      facturas: [
        {
          id: 'F-004',
          numero_factura: 'FAC-2025-3600',
          oc_id: 'OC-2025-003',
          estado: 'RECIBIDA_TOTAL',
          fecha_emision: new Date('2025-05-20'),
          fecha_entrega_esperada: new Date('2025-06-15'),
          fecha_entrega_real: new Date('2025-06-14'),
          proveedor_id: 'P003',
          proveedor_nombre: 'Tecnoquímicas S.A.',
          monto_total: 3_200_000,
          lineas: [
            {
              producto_id: 'SDR-0205',
              producto_nombre: 'Metformina 850mg Tabletas',
              cantidad_pedida: 10000,
              cantidad_recibida: 10000,
              unidad: 'unidades',
              lote: 'LOT-MET-240510',
              fecha_vencimiento: new Date('2027-01-31'),
            },
          ],
          novedades: [],
        },
      ],
      novedades: [],
      audit_trail: [
        { estado_anterior: null, estado_nuevo: 'BORRADOR', fecha: new Date('2025-05-15'), usuario: 'Maria Rojas' },
        { estado_anterior: 'BORRADOR', estado_nuevo: 'VALIDADA', fecha: new Date('2025-05-15'), usuario: 'Carlos Pérez' },
        { estado_anterior: 'VALIDADA', estado_nuevo: 'EMITIDA', fecha: new Date('2025-05-16'), usuario: 'Carlos Pérez' },
        { estado_anterior: 'EMITIDA', estado_nuevo: 'ACTIVA', fecha: new Date('2025-06-14'), usuario: 'Sistema' },
        { estado_anterior: 'ACTIVA', estado_nuevo: 'CERRADA', fecha: new Date('2025-06-14'), usuario: 'Sistema', comentario: 'Recepción completa verificada' },
      ],
    },
    {
      id: 'OC-2025-004',
      numero_oc: 'OC-2025-004',
      estado: 'EMITIDA',
      proveedor_id: 'P001',
      proveedor_nombre: 'Laboratorios Procaps S.A.',
      producto_id: 'SDR-0312',
      producto_nombre: 'Losartán 50mg Tabletas',
      molecula: 'Losartán',
      familia: 2,
      cantidad_total: 3000,
      cantidad_recibida: 0,
      unidad: 'unidades',
      monto_total: 5_100_000,
      fecha_creacion: new Date('2025-07-01'),
      fecha_emision: new Date('2025-07-03'),
      fecha_entrega_esperada: new Date('2025-07-25'),
      otif_pct: 0,
      es_clase_c: false,
      facturas: [],
      novedades: [],
      audit_trail: [
        { estado_anterior: null, estado_nuevo: 'BORRADOR', fecha: new Date('2025-07-01'), usuario: 'Maria Rojas' },
        { estado_anterior: 'BORRADOR', estado_nuevo: 'VALIDADA', fecha: new Date('2025-07-02'), usuario: 'Carlos Pérez' },
        { estado_anterior: 'VALIDADA', estado_nuevo: 'EMITIDA', fecha: new Date('2025-07-03'), usuario: 'Carlos Pérez' },
      ],
    },
    {
      id: 'OC-2025-005',
      numero_oc: 'OC-2025-005',
      estado: 'VALIDADA',
      proveedor_id: 'P004',
      proveedor_nombre: 'Pfizer Colombia S.A.S.',
      producto_id: 'SDR-0407',
      producto_nombre: 'Omeprazol 20mg Cápsulas',
      molecula: 'Omeprazol',
      familia: 4,
      cantidad_total: 8000,
      cantidad_recibida: 0,
      unidad: 'unidades',
      monto_total: 2_800_000,
      fecha_creacion: new Date('2025-07-07'),
      fecha_entrega_esperada: new Date('2025-08-01'),
      otif_pct: 0,
      es_clase_c: false,
      facturas: [],
      novedades: [],
      audit_trail: [
        { estado_anterior: null, estado_nuevo: 'BORRADOR', fecha: new Date('2025-07-07'), usuario: 'Maria Rojas' },
        { estado_anterior: 'BORRADOR', estado_nuevo: 'VALIDADA', fecha: new Date('2025-07-08'), usuario: 'Carlos Pérez' },
      ],
    },
    {
      id: 'OC-2025-006',
      numero_oc: 'OC-2025-006',
      estado: 'BORRADOR',
      proveedor_id: 'P002',
      proveedor_nombre: 'Bayer S.A. Colombia',
      producto_id: 'SDR-0501',
      producto_nombre: 'Atorvastatina 40mg Tabletas',
      molecula: 'Atorvastatina',
      familia: 2,
      cantidad_total: 4000,
      cantidad_recibida: 0,
      unidad: 'unidades',
      monto_total: 9_600_000,
      fecha_creacion: new Date('2025-07-09'),
      fecha_entrega_esperada: new Date('2025-08-10'),
      otif_pct: 0,
      es_clase_c: true,
      facturas: [],
      novedades: [],
      audit_trail: [
        { estado_anterior: null, estado_nuevo: 'BORRADOR', fecha: new Date('2025-07-09'), usuario: 'Maria Rojas' },
      ],
    },
  ];

  // ─── API Methods ─────────────────────────────────────────────────────────

  getOrdenes(filtros?: OcFiltros): Observable<OrdenCompra[]> {
    let result = [...this.MOCK_OCS];

    if (filtros?.estado && filtros.estado !== 'TODAS') {
      result = result.filter(oc => oc.estado === filtros.estado);
    }

    if (filtros?.busqueda?.trim()) {
      const q = filtros.busqueda.toLowerCase();
      result = result.filter(oc =>
        oc.numero_oc.toLowerCase().includes(q) ||
        oc.proveedor_nombre.toLowerCase().includes(q) ||
        oc.producto_nombre.toLowerCase().includes(q) ||
        oc.molecula.toLowerCase().includes(q)
      );
    }

    return of(result).pipe(delay(120));
  }

  getOrdenById(id: string): Observable<OrdenCompra | undefined> {
    return of(this.MOCK_OCS.find(oc => oc.id === id)).pipe(delay(80));
  }

  getKpis(): Observable<TraceabilityKpis> {
    const activas = this.MOCK_OCS.filter(oc => oc.estado === 'ACTIVA').length;
    const novedadesAbiertas = this.MOCK_OCS.flatMap(oc => oc.novedades).filter(n => !n.resuelta).length;
    const pendientesEntrega = this.MOCK_OCS.filter(oc =>
      oc.estado === 'ACTIVA' || oc.estado === 'EMITIDA'
    ).length;

    const ocsConOtif = this.MOCK_OCS.filter(oc => oc.otif_pct > 0);
    const otifGlobal = ocsConOtif.length
      ? ocsConOtif.reduce((acc, oc) => acc + oc.otif_pct, 0) / ocsConOtif.length
      : 0;

    return of({
      ocs_activas: activas,
      otif_global_pct: Math.round(otifGlobal),
      pendientes_entrega: pendientesEntrega,
      novedades_no_resueltas: novedadesAbiertas,
      otif_delta_pct: -3.5,
    }).pipe(delay(100));
  }
}
