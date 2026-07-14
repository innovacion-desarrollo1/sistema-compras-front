import { ProductService, SdrDetailApiResponse } from './product.service';
import { Molecula } from './molecula.service';

describe('ProductService.sdrDetailToMolecula — precios', () => {
  // El método es puro (no usa HttpClient), así que un stub vacío basta.
  const svc = new ProductService({} as any);

  const base: Molecula = {
    id: 0, nombre: 'TEST', codigo: '1-4-2-1-1', codigo_sdr: '1-4-2-1-1',
    familia: 4, es_clase_c: false, productos_count: 0,
    stock_actual: 100, stock_minimo: 50, stock_seguridad: 20,
    precio_promedio: 500, cobertura_dias: 10, demanda_promedio_diaria: 10,
    lt_sistema_dias: 7, eoq: 100, pendientes_diarios: 5,
  };

  const baseDetail: SdrDetailApiResponse = {
    sdr_id: '1-4-2-1-1', descripcion: null,
    stock_actual: 100, stock_seguridad: 20, rop: 50,
    demanda_promedio_diaria: 10, cobertura_dias: 10,
    precio_promedio_inventario: null, precio_promedio_adquisicion: 500,
    pendientes: 5, familia: 4, eoq: 100, lt_sistema_dias: 7,
    clasificacion_abc: null, clasificacion_ved: null, clasificacion_hml: null,
    costo_ultima_compra: null,
    cantidad_sugerida: null, necesita_orden: null, formula_usada: null, razon: null,
  };

  it('mapea precio_promedio_inventario cuando el backend lo entrega', () => {
    const m = svc.sdrDetailToMolecula(base, { ...baseDetail, precio_promedio_inventario: 1234 });
    expect(m.precio_promedio_inventario).toBe(1234);
  });

  it('deja precio_promedio_inventario en null cuando el backend lo omite', () => {
    const m = svc.sdrDetailToMolecula(base, { ...baseDetail, precio_promedio_inventario: null });
    expect(m.precio_promedio_inventario).toBeNull();
  });

  it('conserva precio_promedio (adquisición) desde precio_promedio_adquisicion', () => {
    const m = svc.sdrDetailToMolecula(base, { ...baseDetail, precio_promedio_adquisicion: 850 });
    expect(m.precio_promedio).toBe(850);
  });

  it('mapea costo_ultima_compra desde la respuesta', () => {
    const m = svc.sdrDetailToMolecula(base, { ...baseDetail, costo_ultima_compra: 990 } as any);
    expect(m.costo_ultima_compra).toBe(990);
  });
});
