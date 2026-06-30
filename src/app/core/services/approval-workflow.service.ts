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
      catchError(() => of([])),
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
      catchError(() => of(false)),
    );
  }

  reject(id: number, comentario: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/${id}/reject`, { comentario }).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  returnToModify(id: number, comentario: string): Observable<boolean> {
    return this.http.post<void>(`${this.base}/${id}/return`, { comentario }).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  approveAll(nivel: 'GERENTE' | 'JEFE'): Observable<boolean> {
    return this.http.post<void>(`${this.base}/approve-all`, { nivel }).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
