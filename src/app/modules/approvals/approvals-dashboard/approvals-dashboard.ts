import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, interval, switchMap, startWith } from 'rxjs';
import {
  ApprovalWorkflowService,
  AprobacionItem,
  AprobacionEstado,
} from '../../../core/services/approval-workflow.service';
import { AuthService } from '../../../core/services/auth.service';
import { DuanaRole } from '../../../layout/sidenav/nav-item.model';
import {
  ApprovalActionDialogComponent,
  ApprovalActionDialogData,
} from './approval-action-dialog.component';

@Component({
  selector: 'app-approvals-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './approvals-dashboard.html',
  styleUrl: './approvals-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalsDashboard implements OnInit, OnDestroy {
  private approvalService = inject(ApprovalWorkflowService);
  private auth            = inject(AuthService);
  private dialog          = inject(MatDialog);

  readonly loading       = signal(true);
  readonly items         = signal<AprobacionItem[]>([]);
  readonly actionLoading = signal<number | null>(null);

  private pollSub?: Subscription;

  readonly role = computed<DuanaRole>(() => this.auth.getRole() ?? 'AUXILIAR_COMPRAS');

  readonly filteredItems = computed(() => {
    const r   = this.role();
    const all = this.items();
    if (r === 'GERENTE' || r === 'ADMIN') {
      return all.filter(i => i.estado_aprobacion === 'PENDIENTE_GERENTE');
    }
    if (r === 'JEFE_COMPRAS') {
      return all.filter(i => i.estado_aprobacion === 'PENDIENTE_JEFE');
    }
    return [];
  });

  readonly nivelAprobacion = computed<'GERENTE' | 'JEFE'>(() =>
    (this.role() === 'GERENTE' || this.role() === 'ADMIN') ? 'GERENTE' : 'JEFE'
  );

  readonly subTitle = computed(() =>
    (this.role() === 'GERENTE' || this.role() === 'ADMIN')
      ? 'Ítems PENDIENTE_GERENTE — Familia F1 o costo > $50.000'
      : 'Ítems PENDIENTE_JEFE — Familias estándar'
  );

  readonly displayedColumns = [
    'producto', 'familia', 'costo_unitario', 'cantidad', 'total', 'solicitante', 'tiempo', 'acciones',
  ];

  ngOnInit(): void {
    this.pollSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.approvalService.getPending()),
    ).subscribe(items => {
      this.items.set(items);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  familiaLabel(f: number): string {
    const map: Record<number, string> = {
      1: 'F1 Estratégico',
      2: 'F2 Alta Rot.',
      3: 'F3 Alto Costo',
      4: 'F4 Bajo Rot.',
    };
    return map[f] ?? `F${f}`;
  }

  tiempoTranscurrido(fecha: string): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  openApprove(item: AprobacionItem): void {
    const nivel = this.nivelAprobacion();
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'approve',
        titulo: 'Aprobar ítem',
        mensaje: `¿Confirma la aprobación de <strong>${item.producto_nombre}</strong> × ${item.cantidad} unidades por <strong>${this._fmt(item.costo_total)}</strong>?`,
        comentarioRequerido: false,
        labelBtn: 'Aprobar',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe((result?: { comentario?: string }) => {
      if (result === undefined) return;
      this.actionLoading.set(item.id);
      this.approvalService.approve(item.id, nivel, result.comentario).subscribe(ok => {
        this.actionLoading.set(null);
        if (ok) this._refresh();
      });
    });
  }

  openReject(item: AprobacionItem): void {
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'reject',
        titulo: 'Rechazar ítem',
        mensaje: `Rechazar <strong>${item.producto_nombre}</strong>. El comentario es obligatorio.`,
        comentarioRequerido: true,
        labelBtn: 'Confirmar Rechazo',
        colorBtn: 'warn',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe((result?: { comentario: string }) => {
      if (!result) return;
      this.actionLoading.set(item.id);
      this.approvalService.reject(item.id, result.comentario).subscribe(ok => {
        this.actionLoading.set(null);
        if (ok) this._refresh();
      });
    });
  }

  openReturn(item: AprobacionItem): void {
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'return',
        titulo: 'Devolver a modificación',
        mensaje: `Devolver <strong>${item.producto_nombre}</strong> para ajuste. Indica qué debe corregirse.`,
        comentarioRequerido: true,
        labelBtn: 'Devolver',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe((result?: { comentario: string }) => {
      if (!result) return;
      this.actionLoading.set(item.id);
      this.approvalService.returnToModify(item.id, result.comentario).subscribe(ok => {
        this.actionLoading.set(null);
        if (ok) this._refresh();
      });
    });
  }

  approveAll(): void {
    const count = this.filteredItems().length;
    const nivel = this.nivelAprobacion();
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'approve-all',
        titulo: 'Aprobar todos los ítems',
        mensaje: `¿Confirma la aprobación masiva de <strong>${count} ítem${count !== 1 ? 's' : ''}</strong> pendientes de su nivel?`,
        comentarioRequerido: false,
        labelBtn: 'Aprobar Todo',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe(result => {
      if (result === undefined) return;
      this.loading.set(true);
      this.approvalService.approveAll(nivel).subscribe(ok => {
        if (ok) this._refresh();
        else this.loading.set(false);
      });
    });
  }

  private _refresh(): void {
    this.loading.set(true);
    this.approvalService.getPending().subscribe(items => {
      this.items.set(items);
      this.loading.set(false);
    });
  }

  private _fmt(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  }
}
