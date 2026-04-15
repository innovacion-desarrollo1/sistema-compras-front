import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { DemandForecastService, ForecastData, DemandDataPoint } from '../../../../../core/services/demand-forecast.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-demand-forecast-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './demand-forecast-chart.html',
  styleUrl: './demand-forecast-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandForecastChart implements OnInit, AfterViewInit, OnDestroy {
  @Input() productoId!: number;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  forecastData: ForecastData | null = null;
  isLoading = true;

  constructor(
    private demandService: DemandForecastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.productoId) {
      this.loadForecastData();
    }
  }

  ngAfterViewInit(): void {
    // If data loaded before view initialized, render chart
    if (this.forecastData && !this.chart) {
      this.renderChart(this.forecastData);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadForecastData(): void {
    this.isLoading = true;
    this.demandService.getForecast(this.productoId).subscribe({
      next: (data) => {
        this.forecastData = data;
        if (this.chartCanvas) {
          this.renderChart(data);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Forecast load failed:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderChart(data: ForecastData): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const chartData: ChartData = {
      datasets: [
        // Historical demand (solid line)
        {
          label: 'Historical Demand',
          data: data.historical.map(d => ({ x: d.fecha.getTime(), y: d.cantidad })),
          borderColor: '#3B82F6', // Azure (Dusoft blue)
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.4 // Smooth curve
        },
        // ML prediction (dashed line)
        {
          label: 'ML Prediction',
          data: data.predicted.map(d => ({ x: d.fecha.getTime(), y: d.cantidad })),
          borderColor: '#1E3A8A', // Dark blue
          backgroundColor: 'rgba(30, 58, 138, 0.05)',
          borderWidth: 2,
          borderDash: [5, 5], // Dashed line
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'rectRot',
          tension: 0.4
        },
        // Confidence interval upper bound
        {
          label: '90% Confidence Interval',
          data: data.predicted.map(d => ({ x: d.fecha.getTime(), y: d.confidence_upper! })),
          borderColor: 'rgba(59, 130, 246, 0.3)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          fill: '+1', // Fill to next dataset
          pointRadius: 0,
          borderWidth: 1
        },
        // Confidence interval lower bound
        {
          label: 'CI Lower',
          data: data.predicted.map(d => ({ x: d.fecha.getTime(), y: d.confidence_lower! })),
          borderColor: 'rgba(59, 130, 246, 0)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          pointRadius: 0
        }
      ]
    };

    const config: ChartConfiguration = {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${data.producto_nombre} - ${data.forecast_horizon_months} Month Forecast`,
            font: { size: 16, weight: 'bold' },
            color: '#1F2937'
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              filter: (item) => item.text !== 'CI Lower' // Hide lower bound from legend
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label && label !== 'CI Lower' && context.parsed.y !== null) {
                  label += ': ';
                  label += Math.round(context.parsed.y) + ' units';
                  return label;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'month',
              displayFormats: { month: 'MMM yyyy' }
            },
            title: {
              display: true,
              text: 'Date',
              font: { size: 14, weight: 'bold' }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Quantity Dispensed',
              font: { size: 14, weight: 'bold' }
            },
            beginAtZero: true
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, config);
  }

  getModelAccuracyColor(accuracy: number): string {
    if (accuracy >= 0.85) return 'verde'; // Excellent
    if (accuracy >= 0.70) return 'amarillo'; // Acceptable
    return 'rojo'; // Poor - manual review required
  }

  getModelAccuracyLabel(accuracy: number): string {
    if (accuracy >= 0.85) return 'Excellent';
    if (accuracy >= 0.70) return 'Acceptable';
    return 'Poor - Review Required';
  }
}

