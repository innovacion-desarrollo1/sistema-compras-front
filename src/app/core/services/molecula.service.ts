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
    },
    // FAMILIA 2: Alta rotación, bajo costo
    {
      id: 9,
      nombre: 'CLONAZEPAM',
      codigo: 'MOL-009',
      familia: 2,
      es_clase_c: true,
      productos_count: 5,
      stock_actual: 85,
      stock_minimo: 250,
      stock_seguridad: 100,
      precio_promedio: 3200,
      cobertura_dias: 3.4, // CRÍTICO - Stock muy bajo
      demanda_promedio_diaria: 25,
      lt_sistema_dias: 15,
      eoq: 300,
      pendientes_diarios: 3
    },
    {
      id: 10,
      nombre: 'INSULINA GLARGINA',
      codigo: 'MOL-010',
      familia: 3,
      es_clase_c: true,
      productos_count: 3,
      stock_actual: 45,
      stock_minimo: 150,
      stock_seguridad: 80,
      precio_promedio: 8500, // PRECIO ALTO
      cobertura_dias: 4.5, // CRÍTICO
      demanda_promedio_diaria: 10,
      lt_sistema_dias: 20,
      eoq: 200,
      pendientes_diarios: 2
    },
    {
      id: 11,
      nombre: 'SALBUTAMOL',
      codigo: 'MOL-011',
      familia: 1,
      es_clase_c: false,
      productos_count: 8,
      stock_actual: 950,
      stock_minimo: 700,
      stock_seguridad: 280,
      precio_promedio: 450, // PRECIO BAJO
      cobertura_dias: 13.6,
      demanda_promedio_diaria: 70,
      lt_sistema_dias: 6,
      eoq: 900,
      pendientes_diarios: 8
    },
    {
      id: 12,
      nombre: 'LEVOTIROXINA',
      codigo: 'MOL-012',
      familia: 1,
      es_clase_c: false,
      productos_count: 6,
      stock_actual: 3200,
      stock_minimo: 1200,
      stock_seguridad: 500,
      precio_promedio: 380, // PRECIO BAJO
      cobertura_dias: 32.0, // EXCESO - Stock muy alto
      demanda_promedio_diaria: 100,
      lt_sistema_dias: 7,
      eoq: 1500,
      pendientes_diarios: 12
    },
    // FAMILIA 3: Baja rotación, alto costo
    {
      id: 13,
      nombre: 'ENOXAPARINA',
      codigo: 'MOL-013',
      familia: 3,
      es_clase_c: true,
      productos_count: 4,
      stock_actual: 120,
      stock_minimo: 200,
      stock_seguridad: 90,
      precio_promedio: 6800, // PRECIO ALTO
      cobertura_dias: 8.0, // BAJO
      demanda_promedio_diaria: 15,
      lt_sistema_dias: 18,
      eoq: 250,
      pendientes_diarios: 2
    },
    {
      id: 14,
      nombre: 'CLOPIDOGREL',
      codigo: 'MOL-014',
      familia: 2,
      es_clase_c: false,
      productos_count: 5,
      stock_actual: 890,
      stock_minimo: 600,
      stock_seguridad: 240,
      precio_promedio: 1580,
      cobertura_dias: 14.8,
      demanda_promedio_diaria: 60,
      lt_sistema_dias: 8,
      eoq: 750,
      pendientes_diarios: 7
    },
    {
      id: 15,
      nombre: 'RANITIDINA',
      codigo: 'MOL-015',
      familia: 1,
      es_clase_c: false,
      productos_count: 11,
      stock_actual: 1650,
      stock_minimo: 1000,
      stock_seguridad: 380,
      precio_promedio: 620,
      cobertura_dias: 18.3,
      demanda_promedio_diaria: 90,
      lt_sistema_dias: 7,
      eoq: 1200,
      pendientes_diarios: 11
    },
    // FAMILIA 4: Baja rotación, bajo costo
    {
      id: 16,
      nombre: 'HIDROCLOROTIAZIDA',
      codigo: 'MOL-016',
      familia: 4,
      es_clase_c: false,
      productos_count: 7,
      stock_actual: 280,
      stock_minimo: 400,
      stock_seguridad: 150,
      precio_promedio: 290, // PRECIO BAJO
      cobertura_dias: 9.3, // BAJO
      demanda_promedio_diaria: 30,
      lt_sistema_dias: 10,
      eoq: 500,
      pendientes_diarios: 4
    },
    {
      id: 17,
      nombre: 'CARVEDILOL',
      codigo: 'MOL-017',
      familia: 2,
      es_clase_c: false,
      productos_count: 4,
      stock_actual: 520,
      stock_minimo: 450,
      stock_seguridad: 180,
      precio_promedio: 970,
      cobertura_dias: 13.0,
      demanda_promedio_diaria: 40,
      lt_sistema_dias: 9,
      eoq: 600,
      pendientes_diarios: 5
    },
    {
      id: 18,
      nombre: 'ENALAPRIL',
      codigo: 'MOL-018',
      familia: 1,
      es_clase_c: false,
      productos_count: 9,
      stock_actual: 1280,
      stock_minimo: 900,
      stock_seguridad: 350,
      precio_promedio: 520,
      cobertura_dias: 16.0,
      demanda_promedio_diaria: 80,
      lt_sistema_dias: 7,
      eoq: 1100,
      pendientes_diarios: 9
    },
    {
      id: 19,
      nombre: 'SIMVASTATINA',
      codigo: 'MOL-019',
      familia: 1,
      es_clase_c: false,
      productos_count: 6,
      stock_actual: 750,
      stock_minimo: 650,
      stock_seguridad: 250,
      precio_promedio: 1280,
      cobertura_dias: 12.5,
      demanda_promedio_diaria: 60,
      lt_sistema_dias: 8,
      eoq: 800,
      pendientes_diarios: 7
    },
    {
      id: 20,
      nombre: 'DICLOFENACO',
      codigo: 'MOL-020',
      familia: 1,
      es_clase_c: false,
      productos_count: 14,
      stock_actual: 1950,
      stock_minimo: 1300,
      stock_seguridad: 480,
      precio_promedio: 580,
      cobertura_dias: 17.7,
      demanda_promedio_diaria: 110,
      lt_sistema_dias: 6,
      eoq: 1600,
      pendientes_diarios: 13
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
