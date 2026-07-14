import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

const DUMMY_ITEM = {
  producto_id: 'SDR-001', nombre_comercial: 'Test', molecula: 'X', familia: 2,
  cantidad: 10, moq: 5, proveedor_id: 1, proveedor_nombre: 'Prov A',
  precio_lista: 1000, bonificaciones: 0, costo_real_neto: 1000, es_clase_c: false,
};

describe('CartService empresa_destino', () => {
  let svc: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(CartService);
    svc.addItem(DUMMY_ITEM).subscribe();
  });

  it('defaults empresa_destino to DUANA', () => {
    expect(svc.getCurrentCart()!.items[0].empresa_destino).toBe('DUANA');
  });

  it('setEmpresaDestino updates all items for that supplier', () => {
    svc.setEmpresaDestino(1, 'COSMITET');
    expect(svc.getCurrentCart()!.items[0].empresa_destino).toBe('COSMITET');
  });
});
