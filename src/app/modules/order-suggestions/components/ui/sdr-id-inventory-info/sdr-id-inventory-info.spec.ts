import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdrIdInventoryInfo } from './sdr-id-inventory-info';
import { Molecula } from '../../../../../core/services/molecula.service';

const molecula: Molecula = {
  id: 0, nombre: 'ACETAMINOFEN 500MG', codigo: '1-4-2-1-1', codigo_sdr: '1-4-2-1-1',
  familia: 2, es_clase_c: false, productos_count: 1,
  stock_actual: 100, stock_minimo: 50, stock_seguridad: 20,
  precio_promedio: 850, cobertura_dias: 10, demanda_promedio_diaria: 10,
  lt_sistema_dias: 7, eoq: 100, pendientes_diarios: 5,
};

async function render(sdr: Molecula): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [SdrIdInventoryInfo, NoopAnimationsModule],
  }).compileComponents();
  const fixture = TestBed.createComponent(SdrIdInventoryInfo);
  fixture.componentRef.setInput('sdr', sdr);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function labels(el: HTMLElement): string[] {
  return Array.from(el.querySelectorAll('.metric-label')).map(n => n.textContent?.trim() ?? '');
}

describe('SdrIdInventoryInfo — cards de precio', () => {
  it('muestra la card de Precio Prom. Adquisición con su valor', async () => {
    const el = await render({ ...molecula, precio_promedio: 850 });
    expect(labels(el)).toContain('Precio Prom. Adquisición');
    expect(el.textContent).toContain('850');
  });

  it('muestra N/D en la card de Inventario cuando precio_promedio_inventario es null', async () => {
    const el = await render({ ...molecula, precio_promedio_inventario: null });
    expect(labels(el)).toContain('Precio Prom. Inventario');
    expect(el.textContent).toContain('N/D');
  });

  it('muestra el valor de Inventario cuando el backend lo provee', async () => {
    const el = await render({ ...molecula, precio_promedio_inventario: 1234 });
    // La card de inventario muestra su valor (otras cards pueden ser N/D de forma independiente).
    expect(el.textContent).toContain('1,234');
  });

  it('muestra la card de Costo Última Compra con su valor', async () => {
    const el = await render({ ...molecula, costo_ultima_compra: 1925 });
    expect(labels(el)).toContain('Costo Última Compra');
    expect(el.textContent).toContain('1,925');
  });

  it('muestra N/D en Costo Última Compra cuando es null', async () => {
    const el = await render({ ...molecula, costo_ultima_compra: null });
    expect(labels(el)).toContain('Costo Última Compra');
    expect(el.textContent).toContain('N/D');
  });
});
