import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Molecula } from './molecula.service';

/** DTO que devuelve GET /api/v1/products/search */
interface ProductoSearchApiResponse {
  codigo_producto: string;
  descripcion:     string;
  dci?:            string | null;
  laboratorio?:    string | null;
  codigo_sdr?:     string | null;
  activo:          boolean;
  familia?:        number | null;
  familia_descripcion?: string | null;
  stock_actual?:   number | null;
  cobertura_dias?: number | null;
  rop?:            number | null;
  ss?:             number | null;
}

interface ProductoSearchListApiResponse {
  total:     number;
  productos: ProductoSearchApiResponse[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = '/api/v1/products';

  constructor(private http: HttpClient) {}

  searchProducts(query: string): Observable<Molecula[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', query.trim())
      .set('limit', '50');

    console.log('[ProductService] Buscando:', query.trim());

    return this.http
      .get<ProductoSearchListApiResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(r => r.productos.map(p => this._toMolecula(p))),
        catchError((err) => {
          console.error('[ProductService] Error en búsqueda:', err);
          return of([]);
        }),
      );
  }

  private _toMolecula(p: ProductoSearchApiResponse): Molecula {
    return {
      id:                    0,
      nombre:                p.descripcion,
      codigo:                p.codigo_producto,
      // Preserve SDR code for downstream API calls (suggestions, cart)
      codigo_sdr:            p.codigo_sdr ?? undefined,
      familia:               p.familia ?? 4,
      es_clase_c:            p.familia === 1 || p.familia === 3,
      productos_count:       1,
      stock_actual:          p.stock_actual ?? 0,
      stock_minimo:          p.rop ?? 0,
      stock_seguridad:       p.ss ?? 0,
      precio_promedio:       0,
      cobertura_dias:        p.cobertura_dias ?? 0,
      demanda_promedio_diaria: 0,
      lt_sistema_dias:       7,
      eoq:                   0,
      pendientes_diarios:    0,
    };
  }
}
