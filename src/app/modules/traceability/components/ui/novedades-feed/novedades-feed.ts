import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Novedad, NovedadTipo, NovedadSeveridad } from '../../../models/traceability.models';

const TIPO_LABELS: Record<NovedadTipo, string> = {
  RETRASO: 'Retraso',
  CORTE: 'Corte',
  SUSTITUCION: 'Sustitución',
  ENTREGA_PARCIAL: 'Entrega Parcial',
  OTRO: 'Otro',
};

const TIPO_ICONS: Record<NovedadTipo, string> = {
  RETRASO: 'schedule',
  CORTE: 'block',
  SUSTITUCION: 'swap_horiz',
  ENTREGA_PARCIAL: 'inventory_2',
  OTRO: 'info',
};

const SEV_ICONS: Record<NovedadSeveridad, string> = {
  CRITICA: 'crisis_alert',
  ALTA: 'warning',
  MEDIA: 'error_outline',
  BAJA: 'info',
};

@Component({
  selector: 'app-novedades-feed',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="novedades-feed">

      @if (novedades.length === 0) {
        <div class="novedades-feed__empty" role="status">
          <mat-icon>check_circle</mat-icon>
          <span>Sin novedades registradas</span>
        </div>
      } @else {
        <ul class="novedades-feed__list" role="list">
          @for (nov of novedades; track nov.id) {
            <li
              class="novedad-item"
              [class]="'novedad-item--sev-' + nov.severidad.toLowerCase()"
              [class.novedad-item--resuelta]="nov.resuelta"
            >
              <!-- Severity indicator -->
              <div class="novedad-item__sev-dot" [attr.aria-hidden]="true"></div>

              <!-- Content -->
              <div class="novedad-item__body">
                <div class="novedad-item__header">
                  <span class="novedad-item__tipo">
                    <mat-icon class="novedad-item__tipo-icon">{{ tipoIcons[nov.tipo] }}</mat-icon>
                    {{ tipoLabels[nov.tipo] }}
                  </span>
                  <span class="novedad-item__sev-badge" [attr.aria-label]="'Severidad: ' + nov.severidad">
                    <mat-icon class="novedad-item__sev-icon">{{ sevIcons[nov.severidad] }}</mat-icon>
                    {{ nov.severidad }}
                  </span>
                  @if (nov.resuelta) {
                    <span class="novedad-item__resuelta-badge">
                      <mat-icon>check</mat-icon>Resuelta
                    </span>
                  }
                </div>

                <p class="novedad-item__desc">{{ nov.descripcion }}</p>

                <div class="novedad-item__meta">
                  <span class="novedad-item__fuente">{{ nov.fuente }}</span>
                  <time [dateTime]="nov.fecha_reporte.toISOString()">
                    {{ nov.fecha_reporte | date: 'dd/MM/yyyy HH:mm' }}
                  </time>
                </div>
              </div>
            </li>
          }
        </ul>
      }

    </div>
  `,
  styleUrl: './novedades-feed.scss',
})
export class NovedadesFeed {
  @Input({ required: true }) novedades: Novedad[] = [];

  readonly tipoLabels = TIPO_LABELS;
  readonly tipoIcons = TIPO_ICONS;
  readonly sevIcons = SEV_ICONS;
}
