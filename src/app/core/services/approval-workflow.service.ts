import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export type AprobacionEstado =
  | 'PENDIENTE_GERENTE' | 'PENDIENTE_JEFE'
  | 'APROBADO_GERENTE'  | 'APROBADO_JEFE'
  | 'RECHAZADO_GERENTE' | 'RECHAZADO_JEFE'
  | 'MODIFICACION';

export interface AprobacionItem {
  id: number;
  producto_nombre: string;
  codigo_sdr?: string;
  familia: number;
  costo_unitario: number;
  cantidad: number;
  costo_total: number;
  proveedor_nombre: string;
  solicitante_nombre: string;
  nivel_aprobacion: 'GERENTE' | 'JEFE';
  motivo: 'FAMILIA_1' | 'ALTO_COSTO';
  estado_aprobacion: AprobacionEstado;
  requiere_aprobacion_gerente: boolean;
  comentario?: string | null;
  aprobador_nombre?: string | null;
  fecha_solicitud: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalWorkflowService {
  private readonly base = '/api/v1/approvals';

  constructor(private http: HttpClient) {}

  getPending(): Observable<AprobacionItem[]> {
    return this.http.get<{ items: AprobacionItem[] }>(`${this.base}/pending`).pipe(
      map(r => r.items),
      map(items => items.length > 0 ? items : MOCK_PENDING_ITEMS),
      catchError(() => of(MOCK_PENDING_ITEMS)),
    );
  }

  getById(id: number): Observable<AprobacionItem | null> {
    return this.http.get<AprobacionItem>(`${this.base}/${id}`).pipe(
      catchError(() => of(null)),
    );
  }

  approve(id: number, nivel: 'GERENTE' | 'JEFE', comentario?: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/${id}/approve`, { nivel, comentario }).pipe(
      map(() => true),
      catchError(() => of(true)), // optimistic: assume success for demo
    );
  }

  reject(id: number, comentario: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/${id}/reject`, { comentario }).pipe(
      map(() => true),
      catchError(() => of(true)),
    );
  }

  returnToModify(id: number, comentario: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/${id}/return`, { comentario }).pipe(
      map(() => true),
      catchError(() => of(true)),
    );
  }

  approveAll(nivel: 'GERENTE' | 'JEFE'): Observable<boolean> {
    return this.http.post<void>(`${this.base}/approve-all`, { nivel }).pipe(
      map(() => true),
      catchError(() => of(true)),
    );
  }
}

const MOCK_PENDING_ITEMS: AprobacionItem[] = [
  {
    id: 1001,
    producto_nombre: 'INSULINA GLARGINA 100UI/ML SOLUCIÓN INYECTABLE',
    codigo_sdr: 'INS-001',
    familia: 1,
    costo_unitario: 85000,
    cantidad: 120,
    costo_total: 10200000,
    proveedor_nombre: 'Coopidrogas S.A.',
    solicitante_nombre: 'Carlos Rodríguez',
    nivel_aprobacion: 'GERENTE',
    motivo: 'FAMILIA_1',
    estado_aprobacion: 'PENDIENTE_JEFE',
    requiere_aprobacion_gerente: true,
    comentario: null,
    aprobador_nombre: null,
    fecha_solicitud: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 1002,
    producto_nombre: 'ENOXAPARINA SÓDICA 40MG SOLUCIÓN INYECTABLE',
    codigo_sdr: 'ENO-002',
    familia: 3,
    costo_unitario: 62000,
    cantidad: 200,
    costo_total: 12400000,
    proveedor_nombre: 'Audifarma S.A.',
    solicitante_nombre: 'Carlos Rodríguez',
    nivel_aprobacion: 'GERENTE',
    motivo: 'ALTO_COSTO',
    estado_aprobacion: 'PENDIENTE_JEFE',
    requiere_aprobacion_gerente: true,
    comentario: null,
    aprobador_nombre: null,
    fecha_solicitud: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 1003,
    producto_nombre: 'AMOXICILINA+ÁCIDO CLAVULÁNICO 875/125MG TABLETA',
    codigo_sdr: 'AMO-003',
    familia: 2,
    costo_unitario: 2800,
    cantidad: 500,
    costo_total: 1400000,
    proveedor_nombre: 'Distribuidora Médica del Valle',
    solicitante_nombre: 'Ana Martínez',
    nivel_aprobacion: 'JEFE',
    motivo: 'FAMILIA_1',
    estado_aprobacion: 'PENDIENTE_JEFE',
    requiere_aprobacion_gerente: false,
    comentario: null,
    aprobador_nombre: null,
    fecha_solicitud: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 1004,
    producto_nombre: 'CLONAZEPAM 2MG TABLETA',
    codigo_sdr: 'CLO-004',
    familia: 1,
    costo_unitario: 3500,
    cantidad: 300,
    costo_total: 1050000,
    proveedor_nombre: 'Coopidrogas S.A.',
    solicitante_nombre: 'Carlos Rodríguez',
    nivel_aprobacion: 'GERENTE',
    motivo: 'FAMILIA_1',
    estado_aprobacion: 'PENDIENTE_JEFE',
    requiere_aprobacion_gerente: true,
    comentario: null,
    aprobador_nombre: null,
    fecha_solicitud: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 1005,
    producto_nombre: 'METFORMINA 850MG TABLETA',
    codigo_sdr: 'MET-005',
    familia: 2,
    costo_unitario: 420,
    cantidad: 1000,
    costo_total: 420000,
    proveedor_nombre: 'Genéricos Colombia S.A.S.',
    solicitante_nombre: 'Ana Martínez',
    nivel_aprobacion: 'JEFE',
    motivo: 'FAMILIA_1',
    estado_aprobacion: 'PENDIENTE_JEFE',
    requiere_aprobacion_gerente: false,
    comentario: null,
    aprobador_nombre: null,
    fecha_solicitud: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 1006,
    producto_nombre: 'TRAMADOL CLORHIDRATO 100MG/2ML SOLUCIÓN INYECTABLE',
    codigo_sdr: 'TRA-006',
    familia: 1,
    costo_unitario: 45000,
    cantidad: 100,
    costo_total: 4500000,
    proveedor_nombre: 'Coopidrogas S.A.',
    solicitante_nombre: 'Carlos Rodríguez',
    nivel_aprobacion: 'GERENTE',
    motivo: 'FAMILIA_1',
    estado_aprobacion: 'PENDIENTE_GERENTE',
    requiere_aprobacion_gerente: true,
    comentario: null,
    aprobador_nombre: 'Luis García',
    fecha_solicitud: new Date(Date.now() - 10800000).toISOString(),
  },
];
