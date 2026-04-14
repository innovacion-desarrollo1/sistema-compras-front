import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface ApprovalRequest {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad_solicitada: number;
  proveedor_nombre: string;
  costo_total: number;
  motivo_clase_c: string; // e.g., "Controlled substance (INVIMA Cat 1)"
  
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  solicitante_id: number;
  solicitante_nombre: string;
  fecha_solicitud: Date;
  
  aprobador_id?: number;
  aprobador_nombre?: string;
  fecha_decision?: Date;
  comentario_aprobador?: string;
}

@Injectable({ providedIn: 'root' })
export class ApprovalWorkflowService {
  private apiUrl = '/api/v1/approvals';

  constructor() {}

  /**
   * Submit approval request for Clase C product
   */
  submitRequest(request: Partial<ApprovalRequest>): Observable<ApprovalRequest> {
    // TODO: Replace with actual HTTP POST
    // return this.http.post<ApprovalRequest>(this.apiUrl, request);
    
    const mockRequest: ApprovalRequest = {
      id: Math.floor(Math.random() * 10000),
      producto_id: request.producto_id!,
      producto_nombre: request.producto_nombre!,
      cantidad_solicitada: request.cantidad_solicitada!,
      proveedor_nombre: request.proveedor_nombre!,
      costo_total: request.costo_total!,
      motivo_clase_c: request.motivo_clase_c || 'Controlled substance - INVIMA Category 1',
      estado: 'PENDIENTE',
      solicitante_id: 1,
      solicitante_nombre: 'Auxiliar Demo',
      fecha_solicitud: new Date()
    };
    
    return of(mockRequest).pipe(delay(300));
  }

  /**
   * Get approval request status
   */
  getRequest(id: number): Observable<ApprovalRequest> {
    // TODO: Replace with actual HTTP GET
    // return this.http.get<ApprovalRequest>(`${this.apiUrl}/${id}`);
    
    // Mock: Auto-approve after 5 seconds (simulation)
    const mockRequest: ApprovalRequest = {
      id,
      producto_id: 3,
      producto_nombre: 'Amoxicilina 500mg Capsula',
      cantidad_solicitada: 150,
      proveedor_nombre: 'Droguería Coopidrogas S.A.',
      costo_total: 187500,
      motivo_clase_c: 'Controlled substance - INVIMA Category 1',
      estado: 'APROBADO',
      solicitante_id: 1,
      solicitante_nombre: 'Auxiliar Demo',
      fecha_solicitud: new Date(Date.now() - 300000), // 5 min ago
      aprobador_id: 2,
      aprobador_nombre: 'Jefe de Compras Demo',
      fecha_decision: new Date(),
      comentario_aprobador: 'Approved: Stock level critical'
    };
    
    return of(mockRequest).pipe(delay(200));
  }

  /**
   * Get pending approval requests (for Jefe de Compras)
   */
  getPendingRequests(): Observable<ApprovalRequest[]> {
    // TODO: Replace with actual HTTP GET
    // return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/pending`);
    
    return of([]).pipe(delay(200));
  }

  /**
   * Approve request (Jefe de Compras only)
   */
  approveRequest(id: number, comment: string): Observable<void> {
    // TODO: Replace with actual HTTP PATCH
    // return this.http.patch<void>(`${this.apiUrl}/${id}/approve`, { comment });
    
    return of(void 0).pipe(delay(200));
  }

  /**
   * Reject request (Jefe de Compras only)
   */
  rejectRequest(id: number, reason: string): Observable<void> {
    // TODO: Replace with actual HTTP PATCH
    // return this.http.patch<void>(`${this.apiUrl}/${id}/reject`, { reason });
    
    return of(void 0).pipe(delay(200));
  }
}
