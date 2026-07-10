import {
  Component,
  Input,
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
  OcAuditEvent,
} from '../../../models/traceability.models';

const LIFECYCLE_STEPS: OcEstado[] = [
  'BORRADOR',
  'VALIDADA',
  'EMITIDA',
  'ACTIVA',
  'CERRADA',
];

@Component({
  selector: 'app-oc-lifecycle-stepper',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lifecycle-stepper" role="list" aria-label="Ciclo de vida de la orden">

      @for (step of steps; track step; let i = $index; let last = $last) {
        @let stepIndex = getStepIndex(step);
        @let currentIndex = getStepIndex(oc.estado);
        @let isPast = stepIndex < currentIndex;
        @let isCurrent = step === oc.estado;
        @let isFuture = stepIndex > currentIndex;
        @let event = getAuditEvent(step);

        <div
          class="step"
          [class.step--past]="isPast"
          [class.step--current]="isCurrent"
          [class.step--future]="isFuture"
          role="listitem"
        >
          <!-- Dot + Connector -->
          <div class="step__track">
            <div
              class="step__dot"
              [matTooltip]="event ? formatTooltip(event) : ''"
              matTooltipPosition="above"
              [attr.aria-label]="labels[step] + (isCurrent ? ' — estado actual' : '')"
            >
              <mat-icon class="step__icon">{{ icons[step] }}</mat-icon>
            </div>
            @if (!last) {
              <div class="step__connector" [class.step__connector--filled]="isPast || isCurrent"></div>
            }
          </div>

          <!-- Label -->
          <div class="step__label">
            <span class="step__name">{{ labels[step] }}</span>
            @if (event) {
              <time class="step__date" [dateTime]="event.fecha.toISOString()">
                {{ event.fecha | date: 'dd/MM/yy' }}
              </time>
            }
          </div>
        </div>
      }

    </div>
  `,
  styleUrl: './oc-lifecycle-stepper.scss',
})
export class OcLifecycleStepper {
  @Input({ required: true }) oc!: OrdenCompra;

  readonly steps = LIFECYCLE_STEPS;
  readonly labels = OC_ESTADO_LABELS;
  readonly icons = OC_ESTADO_ICONS;

  getStepIndex(estado: OcEstado): number {
    return LIFECYCLE_STEPS.indexOf(estado);
  }

  getAuditEvent(estado: OcEstado): OcAuditEvent | undefined {
    return this.oc.audit_trail.find((e: OcAuditEvent) => e.estado_nuevo === estado);
  }

  formatTooltip(event: OcAuditEvent): string {
    const date = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
      .format(event.fecha);
    return `${date} · ${event.usuario}${event.comentario ? '\n' + event.comentario : ''}`;
  }
}
