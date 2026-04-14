import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface HistoricalSuggestion {
  id: number;
  producto_nombre: string;
  fecha_generacion: Date;
  cantidad_sugerida: number;
  proveedor_nombre: string;
  costo_total: number;
  
  decision: 'ACEPTADA' | 'RECHAZADA' | 'AJUSTADA';
  fecha_decision: Date;
  usuario_nombre: string;
  
  cantidad_ajustada?: number; // If AJUSTADA
  razon_rechazo?: string; // If RECHAZADA
  comentarios?: string;
}

@Injectable({ providedIn: 'root' })
export class SuggestionHistoryService {
  private apiUrl = '/api/v1/suggestions/history';

  constructor() {}

  /**
   * Get suggestion history for specified days
   */
  getHistory(days: number): Observable<HistoricalSuggestion[]> {
    // TODO: Replace with actual HTTP GET
    // const params = new HttpParams().set('days', days);
    // return this.http.get<HistoricalSuggestion[]>(this.apiUrl, { params });
    
    return this._getMockHistory(days).pipe(delay(300));
  }

  /**
   * Generate mock history data for development
   */
  private _getMockHistory(days: number): Observable<HistoricalSuggestion[]> {
    const now = Date.now();
    const suggestions: HistoricalSuggestion[] = [
      {
        id: 1,
        producto_nombre: 'Acetaminofen 500mg Tableta',
        fecha_generacion: new Date(now - 86400000 * 2), // 2 days ago
        cantidad_sugerida: 200,
        proveedor_nombre: 'Droguería Coopidrogas S.A.',
        costo_total: 250000,
        decision: 'ACEPTADA',
        fecha_decision: new Date(now - 86400000 * 2),
        usuario_nombre: 'Auxiliar Demo'
      },
      {
        id: 2,
        producto_nombre: 'Ibuprofeno 400mg Tableta',
        fecha_generacion: new Date(now - 86400000 * 5), // 5 days ago
        cantidad_sugerida: 150,
        proveedor_nombre: 'La Cruz Verde S.A.S.',
        costo_total: 195750,
        decision: 'AJUSTADA',
        fecha_decision: new Date(now - 86400000 * 5),
        usuario_nombre: 'Auxiliar Demo',
        cantidad_ajustada: 120,
        comentarios: 'Reduced quantity due to budget constraints'
      },
      {
        id: 3,
        producto_nombre: 'Losartan 50mg Tableta',
        fecha_generacion: new Date(now - 86400000 * 7), // 7 days ago
        cantidad_sugerida: 100,
        proveedor_nombre: 'Laboratorios Phoenix S.A.',
        costo_total: 135000,
        decision: 'RECHAZADA',
        fecha_decision: new Date(now - 86400000 * 7),
        usuario_nombre: 'Auxiliar Demo',
        razon_rechazo: 'Stock arrived from previous order'
      },
      {
        id: 4,
        producto_nombre: 'Guantes de Nitrilo Talla M',
        fecha_generacion: new Date(now - 86400000 * 10),
        cantidad_sugerida: 300,
        proveedor_nombre: 'Farmaenlace Colombia Ltda.',
        costo_total: 405000,
        decision: 'ACEPTADA',
        fecha_decision: new Date(now - 86400000 * 10),
        usuario_nombre: 'Auxiliar Demo'
      }
    ];

    return of(suggestions.filter(s => {
      const daysDiff = (now - s.fecha_decision.getTime()) / 86400000;
      return daysDiff <= days;
    }));
  }
}
