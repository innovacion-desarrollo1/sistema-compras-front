import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';

// Interfaces matching skill specification
export interface DemandDataPoint {
  fecha: Date;
  cantidad: number;
  tipo: 'historical' | 'predicted';
  confidence_lower?: number;
  confidence_upper?: number;
}

export interface ForecastData {
  producto_id: number;
  producto_nombre: string;
  familia: number;
  historical: DemandDataPoint[];
  predicted: DemandDataPoint[];
  forecast_horizon_months: number;
  model_accuracy: number; // R² score
  model_type: 'NBEATS' | 'NHITS' | 'TCN';
}

@Injectable({ providedIn: 'root' })
export class DemandForecastService {
  private apiUrl = '/api/v1/demand-forecast';

  constructor() {}

  /**
   * Get demand forecast for a product
   * @param productoId Product ID
   * @returns Observable with forecast data
   */
  getForecast(productoId: number): Observable<ForecastData> {
    // TODO: Replace with actual HTTP call when backend is ready
    // return this.http.get<any>(`${this.apiUrl}/${productoId}`).pipe(
    //   map(response => this._transformDates(response))
    // );
    
    return this._getMockForecast(productoId).pipe(delay(300));
  }

  /**
   * Generate mock forecast data for development
   */
  private _getMockForecast(productoId: number): Observable<ForecastData> {
    const now = new Date();
    const historicalData: DemandDataPoint[] = [];
    const predictedData: DemandDataPoint[] = [];

    // Generate 12 months of historical data with seasonal pattern
    for (let i = 12; i >= 1; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const baseDemand = 100 + productoId * 5; // Base demand varies by product
      const seasonal = Math.sin((fecha.getMonth() / 12) * Math.PI * 2) * 30; // ±30 units seasonal
      const random = (Math.random() - 0.5) * 20; // Random noise
      
      historicalData.push({
        fecha,
        cantidad: Math.max(0, Math.round(baseDemand + seasonal + random)),
        tipo: 'historical'
      });
    }

    // Determine forecast horizon based on familia (mock logic)
    const familia = productoId === 3 ? 3 : (productoId % 2 === 0 ? 2 : 1);
    const horizonMonths = [1, 3, 4].includes(familia) ? 3 : 1;

    // Generate predicted data with confidence intervals
    const lastHistorical = historicalData[historicalData.length - 1].cantidad;
    const trend = (historicalData[historicalData.length - 1].cantidad - historicalData[0].cantidad) / 12;

    for (let i = 1; i <= horizonMonths; i++) {
      const fecha = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const predicted = lastHistorical + (trend * i);
      const uncertainty = predicted * 0.15; // 15% uncertainty

      predictedData.push({
        fecha,
        cantidad: Math.max(0, Math.round(predicted)),
        tipo: 'predicted',
        confidence_lower: Math.max(0, Math.round(predicted - uncertainty)),
        confidence_upper: Math.round(predicted + uncertainty)
      });
    }

    // Calculate mock R² score (higher for critical products)
    const r2Score = familia === 3 ? 0.92 : (familia === 1 ? 0.88 : 0.75);

    return of({
      producto_id: productoId,
      producto_nombre: this._getProductName(productoId),
      familia,
      historical: historicalData,
      predicted: predictedData,
      forecast_horizon_months: horizonMonths,
      model_accuracy: r2Score,
      model_type: 'NBEATS'
    });
  }

  private _getProductName(productoId: number): string {
    const names: Record<number, string> = {
      1: 'Acetaminofen 500mg Tableta',
      2: 'Ibuprofeno 400mg Tableta',
      3: 'Amoxicilina 500mg Capsula',
      4: 'Guantes de Nitrilo Talla M',
      5: 'Losartan 50mg Tableta'
    };
    return names[productoId] || `Producto ${productoId}`;
  }

  /**
   * Transform date strings from API to Date objects
   */
  private _transformDates(data: any): ForecastData {
    return {
      ...data,
      historical: data.historical.map((d: any) => ({
        ...d,
        fecha: new Date(d.fecha)
      })),
      predicted: data.predicted.map((d: any) => ({
        ...d,
        fecha: new Date(d.fecha)
      }))
    };
  }
}
