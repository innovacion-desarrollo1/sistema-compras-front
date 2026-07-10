import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrdenCompra, OC_ESTADO_LABELS, Novedad } from '../../../models/traceability.models';
import { OcLifecycleStepper } from '../oc-lifecycle-stepper/oc-lifecycle-stepper';
import { FacturasEntregasList } from '../facturas-entregas-list/facturas-entregas-list';
import { NovedadesFeed } from '../novedades-feed/novedades-feed';

@Component({
  selector: 'app-oc-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    OcLifecycleStepper,
    FacturasEntregasList,
    NovedadesFeed,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="detail-panel"
      [class.detail-panel--open]="!!oc"
      role="complementary"
      [attr.aria-label]="oc ? 'Detalle de ' + oc.numero_oc : 'Panel de detalle'"
    >

      @if (oc) {

        <!-- Header -->
        <div class="detail-panel__header">
          <div class="detail-panel__title-block">
            <h2 class="detail-panel__oc-num">{{ oc.numero_oc }}</h2>
            <span
              class="detail-panel__estado-badge"
              [class]="'estado-' + oc.estado.toLowerCase()"
            >{{ estadoLabels[oc.estado] }}</span>
          </div>
          <button
            mat-icon-button
            class="detail-panel__close"
            (click)="closed.emit()"
            aria-label="Cerrar panel de detalle"
            matTooltip="Cerrar"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Summary strip -->
        <div class="detail-panel__summary">
          <div class="summary-item">
            <span class="summary-item__label">Proveedor</span>
            <span class="summary-item__value">{{ oc.proveedor_nombre }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Producto</span>
            <span class="summary-item__value">{{ oc.producto_nombre }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Monto</span>
            <span class="summary-item__value summary-item__value--money">
              {{ oc.monto_total | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">OTIF</span>
            <span
              class="summary-item__value summary-item__value--otif"
              [class.otif--good]="oc.otif_pct >= 95"
              [class.otif--warn]="oc.otif_pct >= 70 && oc.otif_pct < 95"
              [class.otif--bad]="oc.otif_pct < 70"
              [attr.aria-label]="'OTIF: ' + oc.otif_pct + '%'"
            >
              <mat-icon>
                {{ oc.otif_pct >= 95 ? 'check_circle' : oc.otif_pct >= 70 ? 'warning' : 'cancel' }}
              </mat-icon>
              {{ oc.otif_pct }}%
            </span>
          </div>
          @if (oc.es_clase_c) {
            <div class="summary-item summary-item--clase-c">
              <span class="clase-c-badge">
                <mat-icon>gavel</mat-icon>
                Clase C — {{ oc.aprobado_por ? 'Aprobado por ' + oc.aprobado_por : 'Pendiente aprobación' }}
              </span>
            </div>
          }
        </div>

        <!-- Delivery progress bar -->
        <div class="detail-panel__progress" role="group" aria-label="Progreso de entrega">
          @let pct = oc.cantidad_total > 0 ? (oc.cantidad_recibida / oc.cantidad_total) * 100 : 0;
          <div class="progress-info">
            <span class="progress-info__label">Entregado</span>
            <span class="progress-info__value" [attr.aria-label]="pct.toFixed(0) + '% entregado'">
              {{ oc.cantidad_recibida | number }} / {{ oc.cantidad_total | number }} {{ oc.unidad }}
            </span>
            <span class="progress-info__pct">{{ pct | number: '1.0-0' }}%</span>
          </div>
          <div class="progress-bar" [attr.aria-valuenow]="pct" [attr.aria-valuemax]="100" role="progressbar">
            <div
              class="progress-bar__fill"
              [class.progress-bar__fill--full]="pct === 100"
              [class.progress-bar__fill--partial]="pct > 0 && pct < 100"
              [style.width.%]="pct"
            ></div>
          </div>
        </div>

        <!-- Lifecycle stepper -->
        <div class="detail-panel__lifecycle">
          <app-oc-lifecycle-stepper [oc]="oc" />
        </div>

        <!-- Tabs: Facturas + Novedades + Audit -->
        <mat-tab-group
          class="detail-panel__tabs"
          animationDuration="150ms"
          [disableRipple]="true"
        >
          <!-- Tab: Facturas / Entregas -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">receipt_long</mat-icon>
              Facturas
              @if (oc.facturas.length > 0) {
                <span class="tab-badge">{{ oc.facturas.length }}</span>
              }
            </ng-template>
            <div class="tab-content">
              <app-facturas-entregas-list [facturas]="oc.facturas" />
            </div>
          </mat-tab>

          <!-- Tab: Novedades -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">notifications_active</mat-icon>
              Novedades
              @if (openNovedades > 0) {
                <span class="tab-badge tab-badge--alert">{{ openNovedades }}</span>
              }
            </ng-template>
            <div class="tab-content">
              <app-novedades-feed [novedades]="oc.novedades" />
            </div>
          </mat-tab>

          <!-- Tab: Auditoría -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">history</mat-icon>
              Auditoría
            </ng-template>
            <div class="tab-content">
              <ul class="audit-list" role="list">
                @for (event of oc.audit_trail; track event.fecha.getTime()) {
                  <li class="audit-item">
                    <div class="audit-item__dot"></div>
                    <div class="audit-item__content">
                      <div class="audit-item__transition">
                        @if (event.estado_anterior) {
                          <span class="audit-item__from">{{ estadoLabels[event.estado_anterior] }}</span>
                          <mat-icon class="audit-item__arrow">arrow_forward</mat-icon>
                        }
                        <span class="audit-item__to">{{ estadoLabels[event.estado_nuevo] }}</span>
                      </div>
                      <div class="audit-item__meta">
                        <span>{{ event.usuario }}</span>
                        <time [dateTime]="event.fecha.toISOString()">
                          {{ event.fecha | date: 'dd/MM/yyyy HH:mm' }}
                        </time>
                      </div>
                      @if (event.comentario) {
                        <p class="audit-item__comment">{{ event.comentario }}</p>
                      }
                    </div>
                  </li>
                }
              </ul>
            </div>
          </mat-tab>
        </mat-tab-group>

      } @else {
        <!-- Empty state -->
        <div class="detail-panel__placeholder" role="status">
          <mat-icon class="detail-panel__placeholder-icon">touch_app</mat-icon>
          <p>Selecciona una orden de compra para ver su detalle</p>
        </div>
      }

    </aside>
  `,
  styleUrl: './oc-detail-panel.scss',
})
export class OcDetailPanel {
  @Input() oc: OrdenCompra | null = null;
  @Output() closed = new EventEmitter<void>();

  readonly estadoLabels = OC_ESTADO_LABELS;

  get openNovedades(): number {
    return this.oc?.novedades.filter((n: Novedad) => !n.resuelta).length ?? 0;
  }
}
