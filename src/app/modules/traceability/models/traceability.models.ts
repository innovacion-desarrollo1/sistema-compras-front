/**
 * Traceability Module — Domain Models
 * EP-003: Trazabilidad y Novedades IA — Módulo 3
 *
 * Refleja el ciclo de vida 1 OC = N Facturas con estados auditados.
 */

// ─── Estado del ciclo de vida de la OC ─────────────────────────────────────

export type OcEstado =
  | 'BORRADOR'
  | 'VALIDADA'
  | 'EMITIDA'
  | 'ACTIVA'
  | 'CERRADA';

export const OC_ESTADO_LABELS: Record<OcEstado, string> = {
  BORRADOR: 'Borrador',
  VALIDADA: 'Validada',
  EMITIDA: 'Emitida',
  ACTIVA: 'Activa',
  CERRADA: 'Cerrada',
};

export const OC_ESTADO_ICONS: Record<OcEstado, string> = {
  BORRADOR: 'draft',
  VALIDADA: 'check_circle',
  EMITIDA: 'send',
  ACTIVA: 'local_shipping',
  CERRADA: 'task_alt',
};

// ─── Clasificación de novedades ─────────────────────────────────────────────

export type NovedadTipo =
  | 'RETRASO'
  | 'CORTE'
  | 'SUSTITUCION'
  | 'ENTREGA_PARCIAL'
  | 'OTRO';

export type NovedadSeveridad = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export interface Novedad {
  id: number;
  oc_id: string;
  tipo: NovedadTipo;
  severidad: NovedadSeveridad;
  descripcion: string;
  fecha_reporte: Date;
  resuelta: boolean;
  fecha_resolucion?: Date;
  fuente: 'MANUAL' | 'PROVEEDOR' | 'SISTEMA';
}

// ─── Facturas y entregas parciales ─────────────────────────────────────────

export type FacturaEstado =
  | 'PENDIENTE'
  | 'EN_TRANSITO'
  | 'RECIBIDA_PARCIAL'
  | 'RECIBIDA_TOTAL'
  | 'DEVUELTA';

export interface EntregaLinea {
  producto_id: string;
  producto_nombre: string;
  cantidad_pedida: number;
  cantidad_recibida: number;
  unidad: string;
  lote?: string;
  fecha_vencimiento?: Date;
}

export interface Factura {
  id: string;
  numero_factura: string;
  oc_id: string;
  estado: FacturaEstado;
  fecha_emision: Date;
  fecha_entrega_esperada: Date;
  fecha_entrega_real?: Date;
  proveedor_id: string;
  proveedor_nombre: string;
  monto_total: number;
  lineas: EntregaLinea[];
  novedades: Novedad[];
}

// ─── Evento de auditoría del ciclo de vida ─────────────────────────────────

export interface OcAuditEvent {
  estado_anterior: OcEstado | null;
  estado_nuevo: OcEstado;
  fecha: Date;
  usuario: string;
  comentario?: string;
}

// ─── Orden de Compra principal ─────────────────────────────────────────────

export interface OrdenCompra {
  id: string;
  numero_oc: string;
  estado: OcEstado;
  proveedor_id: string;
  proveedor_nombre: string;
  producto_id: string;
  producto_nombre: string;
  molecula: string;
  familia: number;
  cantidad_total: number;
  cantidad_recibida: number;
  unidad: string;
  monto_total: number;
  fecha_creacion: Date;
  fecha_emision?: Date;
  fecha_entrega_esperada?: Date;
  fecha_cierre?: Date;
  otif_pct: number;               // % cumplimiento On Time In Full
  facturas: Factura[];
  novedades: Novedad[];
  audit_trail: OcAuditEvent[];
  es_clase_c: boolean;
  aprobado_por?: string;
}

// ─── KPIs del módulo ───────────────────────────────────────────────────────

export interface TraceabilityKpis {
  ocs_activas: number;
  otif_global_pct: number;
  pendientes_entrega: number;
  novedades_no_resueltas: number;
  /** Variación respecto al período anterior */
  otif_delta_pct: number;
}

// ─── Filtros de la tabla maestra ───────────────────────────────────────────

export interface OcFiltros {
  estado?: OcEstado | 'TODAS';
  busqueda?: string;
  proveedor_id?: string;
}
