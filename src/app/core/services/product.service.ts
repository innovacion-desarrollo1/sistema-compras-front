import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { Molecula } from './molecula.service';

/** DTO que devuelve GET /api/v1/sdr/search */
interface SdrSearchApiItem {
  sdr_id:        string;
  descripcion:   string;
  codigo_dusoft: string | null;
}

interface SdrSearchApiResponse {
  total: number;
  sdrs:  SdrSearchApiItem[];
}

/** DTO que devuelve GET /api/v1/sdr/{sdr_id} */
export interface SdrDetailApiResponse {
  sdr_id:                      string;
  descripcion:                 string | null;
  stock_actual:                number | null;
  stock_seguridad:             number | null;
  rop:                         number | null;   // → Molecula.stock_minimo
  demanda_promedio_diaria:     number | null;
  cobertura_dias:              number | null;
  precio_promedio_inventario:  number | null;
  costo_ultima_compra:         number | null;   // → Molecula.costo_ultima_compra
  precio_promedio_adquisicion: number | null;   // → Molecula.precio_promedio
  pendientes:                  number | null;   // → Molecula.pendientes_diarios
  familia:                     number | null;
  eoq:                         number | null;
  lt_sistema_dias:             number | null;
  clasificacion_abc:           string | null;
  clasificacion_ved:           string | null;
  clasificacion_hml:           string | null;
  // Cantidad sugerida OFICIAL (Política v7.2) — null si no disponible
  cantidad_sugerida:           number | null;
  necesita_orden:              boolean | null;
  formula_usada:               string | null;
  razon:                       string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = '/api/v1/sdr';

  constructor(private http: HttpClient) {}

  searchProducts(query: string): Observable<Molecula[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', query.trim())
      .set('limit', '50');

    return this.http
      .get<SdrSearchApiResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(r => r.sdrs.map(s => this._sdrToMolecula(s))),
        catchError(() => of([])),
      );
  }

  getSdrDetail(sdrId: string): Observable<SdrDetailApiResponse> {
    // El endpoint depende de rotacion/dusoft: la 1ª llamada en frío puede tardar
    // o dar 502; una vez que el cache (Redis 12h) se calienta responde rápido.
    // Reintentamos 1 vez ante fallo transitorio. El error se propaga al suscriptor
    // (NO se silencia con {}) para que la UI pueda mostrar "no se pudo cargar".
    return this.http
      .get<SdrDetailApiResponse>(`${this.apiUrl}/${encodeURIComponent(sdrId)}`)
      .pipe(retry({ count: 1, delay: 800 }));
  }

  private _sdrToMolecula(s: SdrSearchApiItem): Molecula {
    return {
      id:                    0,
      nombre:                s.descripcion,
      codigo:                s.sdr_id,
      codigo_sdr:            s.sdr_id,
      familia:               4,
      es_clase_c:            false,
      productos_count:       0,
      stock_actual:          0,
      stock_minimo:          0,
      stock_seguridad:       0,
      precio_promedio:       0,
      cobertura_dias:        0,
      demanda_promedio_diaria: 0,
      lt_sistema_dias:       7,
      eoq:                   0,
      pendientes_diarios:    0,
    };
  }

  sdrDetailToMolecula(base: Molecula, d: SdrDetailApiResponse): Molecula {
    const familia = d.familia ?? base.familia;
    return {
      ...base,
      stock_actual:           d.stock_actual            ?? base.stock_actual,
      stock_minimo:           d.rop                     ?? base.stock_minimo,
      stock_seguridad:        d.stock_seguridad         ?? base.stock_seguridad,
      precio_promedio:        d.precio_promedio_adquisicion ?? base.precio_promedio,
      precio_promedio_inventario: d.precio_promedio_inventario ?? base.precio_promedio_inventario ?? null,
      costo_ultima_compra:        d.costo_ultima_compra ?? base.costo_ultima_compra ?? null,
      cobertura_dias:         d.cobertura_dias          ?? base.cobertura_dias,
      demanda_promedio_diaria: d.demanda_promedio_diaria ?? base.demanda_promedio_diaria,
      lt_sistema_dias:        d.lt_sistema_dias         ?? base.lt_sistema_dias,
      eoq:                    d.eoq                     ?? base.eoq,
      pendientes_diarios:     d.pendientes              ?? base.pendientes_diarios,
      familia,
      // familia===1 (Estratégicos) siempre requiere aprobación GERENTE (HIS-009 bug #4)
      es_clase_c:             familia === 1,
      clasificacion_abc:      d.clasificacion_abc       ?? base.clasificacion_abc,
      clasificacion_ved:      d.clasificacion_ved       ?? base.clasificacion_ved,
      clasificacion_hml:      d.clasificacion_hml       ?? base.clasificacion_hml,
      // Cantidad oficial: se toma tal cual del backend (null = no disponible → el panel lo indica)
      cantidad_sugerida:      d.cantidad_sugerida,
      necesita_orden:         d.necesita_orden,
      formula_usada:          d.formula_usada,
      razon:                  d.razon,
    };
  }
}

const MOCK_PRODUCTOS: Molecula[] = [
  { id: 1, nombre: 'ACETAMINOFEN 500MG TABLETA', codigo: '199A0010046', codigo_sdr: 'ACE-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 2500, stock_minimo: 1200, stock_seguridad: 450, precio_promedio: 850, cobertura_dias: 18, demanda_promedio_diaria: 138, lt_sistema_dias: 7, eoq: 1500, pendientes_diarios: 15 },
  { id: 2, nombre: 'INSULINA GLARGINA 100UI/ML INYECTABLE', codigo: 'INS-001', codigo_sdr: 'INS-001', familia: 1, es_clase_c: true, productos_count: 1, stock_actual: 45, stock_minimo: 150, stock_seguridad: 80, precio_promedio: 85000, cobertura_dias: 4, demanda_promedio_diaria: 11, lt_sistema_dias: 20, eoq: 200, pendientes_diarios: 2 },
  { id: 3, nombre: 'METFORMINA 850MG TABLETA', codigo: 'MET-001', codigo_sdr: 'MET-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 2150, stock_minimo: 1500, stock_seguridad: 550, precio_promedio: 420, cobertura_dias: 21, demanda_promedio_diaria: 102, lt_sistema_dias: 8, eoq: 1800, pendientes_diarios: 12 },
  { id: 4, nombre: 'AMOXICILINA 500MG CÁPSULA', codigo: 'AMO-001', codigo_sdr: 'AMO-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 420, stock_minimo: 800, stock_seguridad: 250, precio_promedio: 1250, cobertura_dias: 7, demanda_promedio_diaria: 60, lt_sistema_dias: 10, eoq: 800, pendientes_diarios: 8 },
  { id: 5, nombre: 'CLONAZEPAM 2MG TABLETA', codigo: 'CLO-001', codigo_sdr: 'CLO-001', familia: 1, es_clase_c: true, productos_count: 1, stock_actual: 85, stock_minimo: 250, stock_seguridad: 100, precio_promedio: 3200, cobertura_dias: 3, demanda_promedio_diaria: 28, lt_sistema_dias: 15, eoq: 300, pendientes_diarios: 3 },
  { id: 6, nombre: 'ENOXAPARINA 40MG INYECTABLE', codigo: 'ENO-001', codigo_sdr: 'ENO-001', familia: 3, es_clase_c: true, productos_count: 1, stock_actual: 120, stock_minimo: 200, stock_seguridad: 90, precio_promedio: 62000, cobertura_dias: 8, demanda_promedio_diaria: 15, lt_sistema_dias: 18, eoq: 250, pendientes_diarios: 2 },
  { id: 7, nombre: 'OMEPRAZOL 20MG CÁPSULA', codigo: 'OME-001', codigo_sdr: 'OME-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 1450, stock_minimo: 1100, stock_seguridad: 400, precio_promedio: 720, cobertura_dias: 16, demanda_promedio_diaria: 90, lt_sistema_dias: 7, eoq: 1300, pendientes_diarios: 11 },
  { id: 8, nombre: 'LOSARTAN 50MG TABLETA', codigo: 'LOS-001', codigo_sdr: 'LOS-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 650, stock_minimo: 600, stock_seguridad: 200, precio_promedio: 890, cobertura_dias: 13, demanda_promedio_diaria: 50, lt_sistema_dias: 7, eoq: 800, pendientes_diarios: 6 },
  { id: 9, nombre: 'IBUPROFENO 400MG TABLETA', codigo: 'IBU-001', codigo_sdr: 'IBU-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 1800, stock_minimo: 900, stock_seguridad: 320, precio_promedio: 650, cobertura_dias: 12, demanda_promedio_diaria: 150, lt_sistema_dias: 6, eoq: 1200, pendientes_diarios: 10 },
  { id: 10, nombre: 'ATORVASTATINA 20MG TABLETA', codigo: 'ATO-001', codigo_sdr: 'ATO-001', familia: 2, es_clase_c: false, productos_count: 1, stock_actual: 1100, stock_minimo: 900, stock_seguridad: 350, precio_promedio: 1150, cobertura_dias: 15, demanda_promedio_diaria: 73, lt_sistema_dias: 8, eoq: 1000, pendientes_diarios: 9 },
];
