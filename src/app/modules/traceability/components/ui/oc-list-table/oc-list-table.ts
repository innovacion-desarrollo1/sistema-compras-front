import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  OrdenCompra,
  OcEstado,
  OC_ESTADO_LABELS,
  OC_ESTADO_ICONS,
  Novedad,
} from '../../../models/traceability.models';

@Component({
  selector: 'app-oc-list-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oc-table-wrapper" role="region" aria-label="Lista de órdenes de compra">

      @if (ordenes.length === 0) {
        <div class="oc-table__empty" role="status">
          <mat-icon>inbox</mat-icon>
          <p>No se encontraron órdenes con los filtros aplicados</p>
        </div>
      } @else {
        <table class="oc-table" aria-label="Órdenes de compra">
          <thead>
            <tr>
              <th scope="col">OC</th>
              <th scope="col">Estado</th>
              <th scope="col">Producto / Molécula</th>
              <th scope="col">Proveedor</th>
              <th scope="col" class="text-right">Monto</th>
              <th scope="col" class="text-right">Entrega</th>
              <th scope="col" class="text-right">OTIF</th>
              <th scope="col" class="text-center">Nov.</th>
            </tr>
          </thead>
          <tbody>
            @for (oc of ordenes; track oc.id) {
              @let openNovedades = oc.novedades.filter(n => !n.resuelta).length;
              <tr
                class="oc-table__row"
                [class.oc-table__row--selected]="selectedId === oc.id"
                [class.oc-table__row--has-novedad]="openNovedades > 0"
                (click)="selected.emit(oc)"
                (keydown.enter)="selected.emit(oc)"
                (keydown.space)="$event.preventDefault(); selected.emit(oc)"
                [tabindex]="0"
                role="row"
                [attr.aria-selected]="selectedId === oc.id"
                [attr.aria-label]="'Orden ' + oc.numero_oc + ', estado ' + estadoLabels[oc.estado]"
              >
                <!-- OC Number -->
                <td class="oc-table__cell oc-table__cell--num">
                  <span class="oc-num">{{ oc.numero_oc }}</span>
                  @if (oc.es_clase_c) {
                    <span class="clase-c-badge" matTooltip="Clase C — requiere aprobación gerencia" aria-label="Clase C">
                      <mat-icon>gavel</mat-icon>C
                    </span>
                  }
                </td>

                <!-- Estado -->
                <td class="oc-table__cell">
                  <span
                    class="estado-chip"
                    [class]="'estado-chip--' + oc.estado.toLowerCase()"
                    [attr.aria-label]="'Estado: ' + estadoLabels[oc.estado]"
                  >
                    <mat-icon class="estado-chip__icon">{{ estadoIcons[oc.estado] }}</mat-icon>
                    {{ estadoLabels[oc.estado] }}
                  </span>
                </td>

                <!-- Producto -->
                <td class="oc-table__cell oc-table__cell--producto">
                  <span class="producto-nombre">{{ oc.molecula }}</span>
                  <span class="producto-sub">{{ oc.producto_nombre }}</span>
                </td>

                <!-- Proveedor -->
                <td class="oc-table__cell oc-table__cell--proveedor">
                  {{ oc.proveedor_nombre }}
                </td>

                <!-- Monto -->
                <td class="oc-table__cell text-right oc-table__cell--money">
                  {{ oc.monto_total | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                </td>

                <!-- Fecha entrega esperada -->
                <td class="oc-table__cell text-right">
                  @if (oc.fecha_entrega_esperada) {
                    <time
                      [dateTime]="oc.fecha_entrega_esperada.toISOString()"
                      [class.date--overdue]="isOverdue(oc)"
                      [matTooltip]="isOverdue(oc) ? 'Entrega vencida' : ''"
                    >
                      {{ oc.fecha_entrega_esperada | date: 'dd/MM/yy' }}
                    </time>
                  } @else {
                    <span class="no-data">—</span>
                  }
                </td>

                <!-- OTIF -->
                <td class="oc-table__cell text-right">
                  @if (oc.estado === 'BORRADOR' || oc.estado === 'VALIDADA') {
                    <span class="no-data">—</span>
                  } @else {
                    <span
                      class="otif-value"
                      [class.otif--good]="oc.otif_pct >= 95"
                      [class.otif--warn]="oc.otif_pct >= 70 && oc.otif_pct < 95"
                      [class.otif--bad]="oc.otif_pct < 70"
                      [attr.aria-label]="'OTIF: ' + oc.otif_pct + '%'"
                    >{{ oc.otif_pct }}%</span>
                  }
                </td>

                <!-- Novedades abiertas -->
                <td class="oc-table__cell text-center">
                  @if (openNovedades > 0) {
                    <span
                      class="nov-badge"
                      [class.nov-badge--critica]="hasCritical(oc)"
                      [matTooltip]="openNovedades + ' novedad(es) sin resolver'"
                      [attr.aria-label]="openNovedades + ' novedades sin resolver'"
                    >
                      <mat-icon>{{ hasCritical(oc) ? 'crisis_alert' : 'warning' }}</mat-icon>
                      {{ openNovedades }}
                    </span>
                  } @else {
                    <span class="no-data" aria-label="Sin novedades">—</span>
                  }
                </td>

              </tr>
            }
          </tbody>
        </table>
      }

    </div>
  `,
  styleUrl: './oc-list-table.scss',
})
export class OcListTable {
  @Input({ required: true }) ordenes: OrdenCompra[] = [];
  @Input() selectedId: string | null = null;
  @Output() selected = new EventEmitter<OrdenCompra>();

  readonly estadoLabels = OC_ESTADO_LABELS;
  readonly estadoIcons  = OC_ESTADO_ICONS;

  isOverdue(oc: OrdenCompra): boolean {
    if (!oc.fecha_entrega_esperada) return false;
    if (oc.estado === 'CERRADA') return false;
    return new Date() > oc.fecha_entrega_esperada;
  }

  hasCritical(oc: OrdenCompra): boolean {
    return oc.novedades.some((n: Novedad) => !n.resuelta && n.severidad === 'CRITICA');
  }
}
