import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { Producto } from '../../modules/modulo1/services/suggestion-state.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/api/v1/products';

  constructor(private http: HttpClient) {}

  searchProducts(query: string): Observable<Producto[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    // TODO: Replace with actual API call when backend is ready
    // For now, return mock data
    return this._getMockProducts(query);
    
    /* Production code:
    const params = new HttpParams()
      .set('q', query)
      .set('limit', '50');

    return this.http.get<Producto[]>(`${this.apiUrl}/search`, { params }).pipe(
      map(products => this._enrichWithGovernance(products))
    );
    */
  }

  private _getMockProducts(query: string): Observable<Producto[]> {
    const mockData: Producto[] = [
      {
        id: 1,
        codigo: 'MED-001',
        nombre_comercial: 'Acetaminofen 500mg',
        molecula: 'Paracetamol',
        categoria_invima: 'Analgesico',
        familia: 1,
        es_clase_c: false,
        stock_actual: 1500,
        unidad_medida: 'TAB'
      },
      {
        id: 2,
        codigo: 'MED-002',
        nombre_comercial: 'Ibuprofeno 400mg',
        molecula: 'Ibuprofeno',
        categoria_invima: 'Antiinflamatorio',
        familia: 1,
        es_clase_c: false,
        stock_actual: 800,
        unidad_medida: 'TAB'
      },
      {
        id: 3,
        codigo: 'MED-003',
        nombre_comercial: 'Amoxicilina 500mg',
        molecula: 'Amoxicilina',
        categoria_invima: 'Antibiotico',
        familia: 2,
        es_clase_c: true,
        stock_actual: 250,
        unidad_medida: 'CAP'
      },
      {
        id: 4,
        codigo: 'INS-001',
        nombre_comercial: 'Guantes de Nitrilo Talla M',
        molecula: 'N/A',
        categoria_invima: 'Insumo Medico',
        familia: 3,
        es_clase_c: false,
        stock_actual: 5000,
        unidad_medida: 'UND'
      },
      {
        id: 5,
        codigo: 'MED-004',
        nombre_comercial: 'Losartan 50mg',
        molecula: 'Losartan',
        categoria_invima: 'Antihipertensivo',
        familia: 2,
        es_clase_c: true,
        stock_actual: 0,
        unidad_medida: 'TAB'
      }
    ];

    const filtered = mockData.filter(p => 
      p.nombre_comercial.toLowerCase().includes(query.toLowerCase()) ||
      p.molecula.toLowerCase().includes(query.toLowerCase()) ||
      p.codigo.toLowerCase().includes(query.toLowerCase())
    );

    return of(filtered).pipe(delay(200)); // Simulate network delay
  }

  private _enrichWithGovernance(products: Producto[]): Producto[] {
    return products.map(p => ({
      ...p,
      es_clase_c: this._isClaseC(p)
    }));
  }

  private _isClaseC(producto: Producto): boolean {
    // Class C criteria: High-cost or controlled substances
    return producto.categoria_invima === 'Antibiotico' || 
           producto.categoria_invima === 'Antihipertensivo' ||
           producto.familia === 2;
  }
}
