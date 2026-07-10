import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Factura, FacturaEstado } from '../../../models/traceability.models';

const ESTADO_LABELS: Record<FacturaEstado, string> = {
  PENDIENTE: 'Pendiente',
  EN_TRANSITO: 'En tránsito',
  RECIBIDA_PARCIAL: 'Parcial',
  RECIBIDA_TOTAL: 'Recibida',
  DEVUELTA: 'Devuelta',
};

const ESTADO_ICONS: Record<FacturaEstado, string> = {
  PENDIENTE: 'hourglass_empty',
  EN_TRANSITO: 'local_shipping',
  RECIBIDA_PARCIAL: 'inventory_2',
  RECIBIDA_TOTAL: 'check_circle',
  DEVUELTA: 'assignment_return',
};

@Component({
  selector: 'app-facturas-entregas-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="facturas-list">

      @if (facturas.length === 0) {
        <div class="facturas-list__empty" role="status">
          <mat-icon>receipt_long</mat-icon>
          <span>Sin facturas registradas para esta OC</span>
        </div>
      } @else {
        @for (factura of facturas; track factura.id; let i = $index) {
          <div class="factura-card">

            <!-- Header -->
            <div class="factura-card__header">
              <div class="factura-card__title">
                <mat-icon class="factura-card__icon">receipt</mat-icon>
                <span class="factura-card__num">{{ factura.numero_factura }}</span>
              </div>
              <span
                class="factura-card__estado"
                [class]="'factura-card__estado--' + factura.estado.toLowerCase()"
              >
                <mat-icon>{{ estadoIcons[factura.estado] }}</mat-icon>
                {{ estadoLabels[factura.estado] }}
              </span>
            </div>

            <!-- Dates -->
            <div class="factura-card__dates">
              <div class="date-item">
                <span class="date-item__label">Entrega esperada</span>
                <time [dateTime]="factura.fecha_entrega_esperada.toISOString()">
                  {{ factura.fecha_entrega_esperada | date: 'dd/MM/yyyy' }}
                </time>
              </div>
              @if (factura.fecha_entrega_real) {
                <div class="date-item">
                  <span class="date-item__label">Entrega real</span>
                  <time
                    [dateTime]="factura.fecha_entrega_real.toISOString()"
                    [class.date-item__value--late]="isLate(factura)"
                    [class.date-item__value--ontime]="isOnTime(factura)"
                  >
                    {{ factura.fecha_entrega_real | date: 'dd/MM/yyyy' }}
                  </time>
                </div>
              }
              <div class="date-item">
                <span class="date-item__label">Monto</span>
                <span class="date-item__value date-item__value--money">
                  {{ factura.monto_total | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>
            </div>

            <!-- Líneas de producto -->
            <table class="factura-card__lineas" aria-label="Líneas de entrega">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" class="text-right">Pedido</th>
                  <th scope="col" class="text-right">Recibido</th>
                  <th scope="col" class="text-right">%</th>
                  <th scope="col">Lote</th>
                </tr>
              </thead>
              <tbody>
                @for (linea of factura.lineas; track linea.producto_id) {
                  @let pct = linea.cantidad_pedida > 0
                    ? (linea.cantidad_recibida / linea.cantidad_pedida) * 100
                    : 0;
                  <tr>
                    <td class="linea-producto">{{ linea.producto_nombre }}</td>
                    <td class="text-right">{{ linea.cantidad_pedida | number }} {{ linea.unidad }}</td>
                    <td class="text-right">{{ linea.cantidad_recibida | number }} {{ linea.unidad }}</td>
                    <td class="text-right">
                      <span
                        class="linea-pct"
                        [class.linea-pct--full]="pct === 100"
                        [class.linea-pct--partial]="pct > 0 && pct < 100"
                        [class.linea-pct--zero]="pct === 0"
                        [attr.aria-label]="pct.toFixed(0) + '% recibido'"
                      >{{ pct | number: '1.0-0' }}%</span>
                    </td>
                    <td class="linea-lote">{{ linea.lote ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>

          </div>
        }
      }

    </div>
  `,
  styleUrl: './facturas-entregas-list.scss',
})
export class FacturasEntregasList {
  @Input({ required: true }) facturas: Factura[] = [];

  readonly estadoLabels = ESTADO_LABELS;
  readonly estadoIcons = ESTADO_ICONS;

  isLate(f: Factura): boolean {
    return !!f.fecha_entrega_real && f.fecha_entrega_real > f.fecha_entrega_esperada;
  }

  isOnTime(f: Factura): boolean {
    return !!f.fecha_entrega_real && f.fecha_entrega_real <= f.fecha_entrega_esperada;
  }
}
