import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';

export interface HistorialCosto {
  id: number;
  proveedor_id: number;
  producto_id: number;
  costo: number;
  fecha_efectiva: Date;
  motivo: string;
  usuario_modifico: string;
  fecha_registro: Date;
}

export interface ActualizacionCosto {
  proveedor_id: number;
  producto_id: number;
  nuevo_costo: number;
  fecha_efectiva: Date;
  motivo: string;
  costo_anterior: number;
}

@Injectable({
  providedIn: 'root'
})
export class CostoProveedorService {
  // Mock data storage - en producción sería una API REST
  private historialMock: Map<string, HistorialCosto[]> = new Map();
  private nextId = 1;
  
  // Subject para notificar cambios de costos a otros componentes
  private costoActualizadoSubject = new BehaviorSubject<ActualizacionCosto | null>(null);
  public costoActualizado$ = this.costoActualizadoSubject.asObservable();

  constructor() {
    this._initializeMockData();
  }

  /**
   * Actualiza el costo de un producto para un proveedor específico
   */
  updateCosto(actualizacion: ActualizacionCosto): Observable<void> {
    const key = this._getKey(actualizacion.proveedor_id, actualizacion.producto_id);
    
    const nuevoRegistro: HistorialCosto = {
      id: this.nextId++,
      proveedor_id: actualizacion.proveedor_id,
      producto_id: actualizacion.producto_id,
      costo: actualizacion.nuevo_costo,
      fecha_efectiva: actualizacion.fecha_efectiva,
      motivo: actualizacion.motivo || 'Actualización manual',
      usuario_modifico: 'admin@duana.com', // En producción vendría del servicio de auth
      fecha_registro: new Date()
    };

    // Obtener o crear historial
    let historial = this.historialMock.get(key) || [];
    historial.push(nuevoRegistro);
    this.historialMock.set(key, historial);

    // Notificar a componentes suscritos
    this.costoActualizadoSubject.next(actualizacion);

    console.log('[CostoProveedorService] Costo actualizado:', {
      proveedor: actualizacion.proveedor_id,
      producto: actualizacion.producto_id,
      costo_anterior: actualizacion.costo_anterior,
      costo_nuevo: actualizacion.nuevo_costo,
      delta: actualizacion.nuevo_costo - actualizacion.costo_anterior,
      fecha: actualizacion.fecha_efectiva
    });

    // Simular API call
    return of(void 0).pipe(delay(500));
  }

  /**
   * Obtiene el historial de costos para un producto/proveedor
   */
  getHistorialCostos(proveedor_id: number, producto_id: number): Observable<HistorialCosto[]> {
    const key = this._getKey(proveedor_id, producto_id);
    const historial = this.historialMock.get(key) || [];
    
    // Ordenar por fecha descendente (más reciente primero)
    const sorted = [...historial].sort((a, b) => 
      b.fecha_registro.getTime() - a.fecha_registro.getTime()
    );

    return of(sorted).pipe(delay(300));
  }

  /**
   * Obtiene el costo más reciente (efectivo) para un producto/proveedor
   */
  getCostoActual(proveedor_id: number, producto_id: number): Observable<number | null> {
    return this.getHistorialCostos(proveedor_id, producto_id).pipe(
      map(historial => {
        if (historial.length === 0) return null;
        
        // Filtrar solo los registros cuya fecha efectiva ya pasó
        const hoy = new Date();
        const efectivos = historial.filter(h => new Date(h.fecha_efectiva) <= hoy);
        
        if (efectivos.length === 0) return null;
        
        // Retornar el más reciente
        return efectivos[0].costo;
      })
    );
  }

  /**
   * Calcula el costo promedio histórico de un producto
   */
  getCostoPromedioHistorico(producto_id: number, ultimos_meses: number = 6): Observable<number> {
    // En producción haría una query agregada a la DB
    // Aquí simulamos con los datos mock
    const fechaCorte = new Date();
    fechaCorte.setMonth(fechaCorte.getMonth() - ultimos_meses);

    let todosLosHistoriales: HistorialCosto[] = [];
    this.historialMock.forEach((historial, key) => {
      if (key.includes(`_${producto_id}`)) {
        todosLosHistoriales = todosLosHistoriales.concat(historial);
      }
    });

    // Filtrar por fecha
    const historicosRecientes = todosLosHistoriales.filter(h => 
      new Date(h.fecha_registro) >= fechaCorte
    );

    if (historicosRecientes.length === 0) {
      return of(0);
    }

    const suma = historicosRecientes.reduce((acc, h) => acc + h.costo, 0);
    const promedio = suma / historicosRecientes.length;

    return of(promedio).pipe(delay(200));
  }

  private _getKey(proveedor_id: number, producto_id: number): string {
    return `${proveedor_id}_${producto_id}`;
  }

  private _initializeMockData(): void {
    // Inicializar con algunos datos históricos para testing
    const mockData: HistorialCosto[] = [
      {
        id: this.nextId++,
        proveedor_id: 101,
        producto_id: 1,
        costo: 1200,
        fecha_efectiva: new Date(2024, 10, 1), // Nov 2024
        motivo: 'Precio inicial del sistema',
        usuario_modifico: 'system@duana.com',
        fecha_registro: new Date(2024, 10, 1)
      },
      {
        id: this.nextId++,
        proveedor_id: 101,
        producto_id: 1,
        costo: 1220,
        fecha_efectiva: new Date(2024, 11, 15), // Dic 2024
        motivo: 'Ajuste inflacionario Q4',
        usuario_modifico: 'admin@duana.com',
        fecha_registro: new Date(2024, 11, 10)
      },
      {
        id: this.nextId++,
        proveedor_id: 102,
        producto_id: 1,
        costo: 1280,
        fecha_efectiva: new Date(2024, 10, 1),
        motivo: 'Precio inicial del sistema',
        usuario_modifico: 'system@duana.com',
        fecha_registro: new Date(2024, 10, 1)
      }
    ];

    mockData.forEach(registro => {
      const key = this._getKey(registro.proveedor_id, registro.producto_id);
      let historial = this.historialMock.get(key) || [];
      historial.push(registro);
      this.historialMock.set(key, historial);
    });
  }
}
