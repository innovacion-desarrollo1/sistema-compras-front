export interface ProveedorItem {
  nit: string;
  nombre: string | null;
  activo: boolean;
  bloqueado?: boolean;
  vende_a_duana: boolean;
  vende_a_cosmitet: boolean;
  monto_minimo: number | null;
  tiempo_entrega: string | null;
  tipo_producto: string | null;
  total_ordenes_duana: number;
  total_ordenes_cosmitet: number;
  fecha_ultima_orden_duana: string | null;
  fecha_ultima_orden_cosmitet: string | null;
  fecha_actualizacion: string | null;
}

export interface ProveedorUpdate {
  activo?: boolean;
  vende_a_duana?: boolean;
  vende_a_cosmitet?: boolean;
  monto_minimo?: number | null;
  tiempo_entrega?: string | null;
  tipo_producto?: string | null;
}
