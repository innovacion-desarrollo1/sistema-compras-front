import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

import { TraceabilityService } from '../../../services/traceability.service';
import {
  OrdenCompra,
  OcEstado,
  OC_ESTADO_LABELS,
  OcFiltros,
  TraceabilityKpis,
} from '../../../models/traceability.models';
import { OcListTable } from '../../ui/oc-list-table/oc-list-table';
import { OcDetailPanel } from '../../ui/oc-detail-panel/oc-detail-panel';

type EstadoFiltro = OcEstado | 'TODAS';

const ESTADO_FILTROS: { value: EstadoFiltro; label: string }[] = [
  { value: 'TODAS',    label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'VALIDADA', label: 'Validada' },
  { value: 'EMITIDA',  label: 'Emitida' },
  { value: 'ACTIVA',   label: 'Activa' },
  { value: 'CERRADA',  label: 'Cerrada' },
];

@Component({
  selector: 'app-traceability-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    OcListTable,
    OcDetailPanel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './traceability-dashboard.html',
  styleUrl: './traceability-dashboard.scss',
})
export class TraceabilityDashboard implements OnInit, OnDestroy {
  private service = inject(TraceabilityService);
  private cdr     = inject(ChangeDetectorRef);

  // ─── State ─────────────────────────────────────────────────────────────

  ordenes  = signal<OrdenCompra[]>([]);
  kpis     = signal<TraceabilityKpis | null>(null);
  loading  = signal(true);
  kpisLoading = signal(true);

  selectedOc = signal<OrdenCompra | null>(null);

  estadoFiltro  = signal<EstadoFiltro>('TODAS');
  busqueda      = signal('');

  readonly estadoFiltros = ESTADO_FILTROS;

  private search$ = new Subject<string>();
  private searchSub?: Subscription;

  // ─── Lifecycle ────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadKpis();
    this.loadOrdenes();

    // Debounced search
    this.searchSub = this.search$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
    ).subscribe((q: string) => {
      this.busqueda.set(q);
      this.loadOrdenes();
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  // ─── Data loading ─────────────────────────────────────────────────────

  loadOrdenes(): void {
    this.loading.set(true);
    const filtros: OcFiltros = {
      estado:   this.estadoFiltro(),
      busqueda: this.busqueda(),
    };

    this.service.getOrdenes(filtros).subscribe({
      next: (ocs: OrdenCompra[]) => {
        this.ordenes.set(ocs);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  loadKpis(): void {
    this.kpisLoading.set(true);
    this.service.getKpis().subscribe({
      next: (k: TraceabilityKpis) => {
        this.kpis.set(k);
        this.kpisLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.kpisLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ─── Handlers ─────────────────────────────────────────────────────────

  onSearch(value: string): void {
    this.search$.next(value);
  }

  onEstadoChange(estado: EstadoFiltro): void {
    this.estadoFiltro.set(estado);
    this.loadOrdenes();
  }

  onOcSelected(oc: OrdenCompra): void {
    // Toggle: click same row to deselect
    if (this.selectedOc()?.id === oc.id) {
      this.selectedOc.set(null);
    } else {
      this.selectedOc.set(oc);
    }
  }

  onPanelClosed(): void {
    this.selectedOc.set(null);
  }

  // ─── Computed helpers ─────────────────────────────────────────────────

  get otifDeltaSign(): string {
    const delta = this.kpis()?.otif_delta_pct ?? 0;
    return delta >= 0 ? '+' : '';
  }

  get otifDeltaClass(): string {
    const delta = this.kpis()?.otif_delta_pct ?? 0;
    if (delta > 0) return 'kpi-delta--up';
    if (delta < 0) return 'kpi-delta--down';
    return '';
  }

  get otifClass(): string {
    const pct = this.kpis()?.otif_global_pct ?? 0;
    if (pct >= 95) return 'kpi-value--good';
    if (pct >= 70) return 'kpi-value--warn';
    return 'kpi-value--bad';
  }

  formatCOP(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  }
}
