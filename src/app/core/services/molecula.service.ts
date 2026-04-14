import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Molecula {
  id: number;
  nombre: string;
  codigo: string;
  familia: number;
  es_clase_c: boolean;
  productos_count: number; // Number of products with this molecule
  // Inventory data (from Políticas 2026)
  stock_actual: number;
  stock_minimo: number; // ROP (Reorder Point)
  stock_seguridad: number; // SS (Safety Stock)
  precio_promedio: number; // Average unit cost
  cobertura_dias: number; // Days of coverage at current demand
  demanda_promedio_diaria: number;
  lt_sistema_dias: number; // Lead time in days
  eoq: number; // Economic Order Quantity
  pendientes_diarios: number; // Daily pending demand
}

@Injectable({
  providedIn: 'root'
})
export class MoleculaService {
  private mockMoleculas: Molecula[] = [
    {
      id: 1,
      nombre: 'ACETAMINOFEN',
      codigo: 'MOL-001',
      familia: 1,
      es_clase_c: false,
      productos_count: 15,
      stock_actual: 1850,
      stock_minimo: 1200, // ROP
      stock_seguridad: 450,
      precio_promedio: 850,
      cobertura_dias: 18.5,
      demanda_promedio_diaria: 100,
      lt_sistema_dias: 7,
      eoq: 1500,
      pendientes_diarios: 15
    },
    {
      id: 2,
      nombre: 'IBUPROFENO',
      codigo: 'MOL-002',
      familia: 1,
      es_clase_c: false,
      productos_count: 12,
      stock_actual: 980,
      stock_minimo: 900,
      stock_seguridad: 320,
      precio_promedio: 650,
      cobertura_dias: 12.3,
      demanda_promedio_diaria: 80,
      lt_sistema_dias: 6,
      eoq: 1200,
      pendientes_diarios: 10
    },
    {
      id: 3,
      nombre: 'AMOXICILINA',
      codigo: 'MOL-003',
      familia: 2,
      es_clase_c: true,
      productos_count: 8,
      stock_actual: 420,
      stock_minimo: 800,
      stock_seguridad: 250,
      precio_promedio: 1250,
      cobertura_dias: 7.0,
      demanda_promedio_diaria: 60,
      lt_sistema_dias: 10,
      eoq: 800,
      pendientes_diarios: 8
    },
    {
      id: 4,
      nombre: 'METFORMINA',
      codigo: 'MOL-004',
      familia: 1,
      es_clase_c: false,
      productos_count: 10,
      stock_actual: 2150,
      stock_minimo: 1500,
      stock_seguridad: 550,
      precio_promedio: 420,
      cobertura_dias: 21.5,
      demanda_promedio_diaria: 100,
      lt_sistema_dias: 8,
      eoq: 1800,
      pendientes_diarios: 12
    },
    {
      id: 5,
      nombre: 'LOSARTAN',
      codigo: 'MOL-005',
      familia: 1,
      es_clase_c: false,
      productos_count: 6,
      stock_actual: 650,
      stock_minimo: 600,
      stock_seguridad: 200,
      precio_promedio: 890,
      cobertura_dias: 13.0,
      demanda_promedio_diaria: 50,
      lt_sistema_dias: 7,
      eoq: 800,
      pendientes_diarios: 6
    },
    {
      id: 6,
      nombre: 'ATORVASTATINA',
      codigo: 'MOL-006',
      familia: 1,
      es_clase_c: false,
      productos_count: 7,
      stock_actual: 1100,
      stock_minimo: 900,
      stock_seguridad: 350,
      precio_promedio: 1150,
      cobertura_dias: 15.7,
      demanda_promedio_diaria: 70,
      lt_sistema_dias: 8,
      eoq: 1000,
      pendientes_diarios: 9
    },
    {
      id: 7,
      nombre: 'TRAMADOL',
      codigo: 'MOL-007',
      familia: 3,
      es_clase_c: true,
      productos_count: 4,
      stock_actual: 180,
      stock_minimo: 300,
      stock_seguridad: 120,
      precio_promedio: 2500,
      cobertura_dias: 6.0,
      demanda_promedio_diaria: 30,
      lt_sistema_dias: 12,
      eoq: 400,
      pendientes_diarios: 4
    },
    {
      id: 8,
      nombre: 'OMEPRAZOL',
      codigo: 'MOL-008',
      familia: 1,
      es_clase_c: false,
      productos_count: 9,
      stock_actual: 1450,
      stock_minimo: 1100,
      stock_seguridad: 400,
      precio_promedio: 720,
      cobertura_dias: 16.1,
      demanda_promedio_diaria: 90,
      lt_sistema_dias: 7,
      eoq: 1300,
      pendientes_diarios: 11
    }
  ];

  searchMoleculas(query: string): Observable<Molecula[]> {
    if (!query || query.trim() === '') {
      return of(this.mockMoleculas);
    }

    const queryLower = query.toLowerCase();
    const filtered = this.mockMoleculas.filter(m =>
      m.nombre.toLowerCase().includes(queryLower) ||
      m.codigo.toLowerCase().includes(queryLower)
    );

    return of(filtered);
  }

  getMoleculaById(id: number): Observable<Molecula | undefined> {
    const molecula = this.mockMoleculas.find(m => m.id === id);
    return of(molecula);
  }
}
