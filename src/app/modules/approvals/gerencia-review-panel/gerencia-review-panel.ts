import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ApprovalActionDialogComponent,
  ApprovalActionDialogData,
} from '../approvals-dashboard/approval-action-dialog.component';

export interface HistorialDecision {
  fecha_sugerencia: string;
  cantidad_sugerida: number;
  decision_usuario: 'ACEPTADA' | 'AJUSTADA' | 'RECHAZADA';
  usuario_id: string;
  cantidad_final_orden?: number;
}

export interface AprobacionItemDetail {
  id: number;
  producto_nombre: string;
  codigo_sdr: string;
  familia: number;
  familia_descripcion: string;
  clasificacion_abc: string;
  clasificacion_ved: string;
  proveedor_nombre: string;
  score_80_20: number;
  stock_actual: number;
  rop: number;
  ss: number;
  cantidad_propuesta: number;
  empresa: string;
  ultima_compra_fecha: string | null;
  demanda_diaria: number;
  dias_cobertura_actual: number;
  dias_cobertura_proyectado: number;
  riesgo_quiebre: 'CRITICO' | 'ALTO' | 'OK';
  costo_promedio_adquisicion: number;
  costo_promedio_inventario: number;
  valor_inventario_actual: number;
  ventas_90_dias: number | null;
  ingreso_estimado_90_dias: number | null;
  dusoft_disponible: boolean;
  historial: HistorialDecision[];
  estado_aprobacion: string;
  requiere_aprobacion_gerente?: boolean;
  comentario?: string | null;
  aprobador_nombre?: string | null;
  solicitante_nombre: string;
  nivel_aprobacion: 'GERENTE' | 'JEFE';
}

const MOCK_DETAIL: AprobacionItemDetail = {
  id: 1001,
  producto_nombre: 'INSULINA GLARGINA 100UI/ML SOLUCIÓN INYECTABLE',
  codigo_sdr: 'INS-001',
  familia: 1,
  familia_descripcion: 'F1 — Alta rotación, alto costo estratégico',
  clasificacion_abc: 'A',
  clasificacion_ved: 'V',
  proveedor_nombre: 'Coopidrogas S.A.',
  score_80_20: 12.4,
  stock_actual: 45,
  rop: 150,
  ss: 80,
  cantidad_propuesta: 120,
  empresa: 'DUANA LTDA',
  ultima_compra_fecha: '2025-05-15',
  demanda_diaria: 11,
  dias_cobertura_actual: 4,
  dias_cobertura_proyectado: 15,
  riesgo_quiebre: 'CRITICO',
  costo_promedio_adquisicion: 82000,
  costo_promedio_inventario: 77500,
  valor_inventario_actual: 3825000,
  ventas_90_dias: 990,
  ingreso_estimado_90_dias: 99000000,
  dusoft_disponible: true,
  estado_aprobacion: 'PENDIENTE_GERENTE',
  requiere_aprobacion_gerente: true,
  comentario: null,
  aprobador_nombre: 'Luis García',
  solicitante_nombre: 'Carlos Rodríguez',
  nivel_aprobacion: 'GERENTE',
  historial: [
    { fecha_sugerencia: '2025-06-01', cantidad_sugerida: 100, decision_usuario: 'ACEPTADA', usuario_id: 'carlos.r', cantidad_final_orden: 100 },
    { fecha_sugerencia: '2025-05-01', cantidad_sugerida: 150, decision_usuario: 'AJUSTADA', usuario_id: 'carlos.r', cantidad_final_orden: 120 },
    { fecha_sugerencia: '2025-04-01', cantidad_sugerida: 100, decision_usuario: 'RECHAZADA', usuario_id: 'jefe.compras' },
    { fecha_sugerencia: '2025-03-01', cantidad_sugerida: 120, decision_usuario: 'ACEPTADA', usuario_id: 'carlos.r', cantidad_final_orden: 120 },
    { fecha_sugerencia: '2025-02-01', cantidad_sugerida: 80, decision_usuario: 'AJUSTADA', usuario_id: 'ana.m', cantidad_final_orden: 100 },
  ],
};

@Component({
  selector: 'app-gerencia-review-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './gerencia-review-panel.html',
  styleUrl: './gerencia-review-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GerenciaReviewPanel implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private http            = inject(HttpClient);
  private snackBar        = inject(MatSnackBar);
  private dialog          = inject(MatDialog);
  private approvalService = inject(ApprovalWorkflowService);
  private auth            = inject(AuthService);

  readonly loading = signal(true);
  readonly detail  = signal<AprobacionItemDetail | null>(null);
  readonly acting  = signal(false);

  readonly isGerente = computed(() => {
    const r = this.auth.getRole();
    return r === 'GERENTE' || r === 'ADMIN';
  });

  readonly panelTitle = computed(() =>
    this.isGerente() ? 'Revisión Gerencial' : 'Revisión Jefe de Compras'
  );

  readonly nivelActual = computed<'GERENTE' | 'JEFE'>(() =>
    this.isGerente() ? 'GERENTE' : 'JEFE'
  );

  readonly historialColumns = ['fecha', 'cantidad_sugerida', 'decision', 'usuario', 'cantidad_final'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.http
      .get<AprobacionItemDetail>(`/api/v1/approvals/items/${id}/detail`)
      .pipe(catchError(() => of(null)))
      .subscribe(data => {
        this.detail.set(data ?? { ...MOCK_DETAIL, id });
        this.loading.set(false);
      });
  }

  riesgoColor(r: string): string {
    if (r === 'CRITICO') return 'rojo';
    if (r === 'ALTO')    return 'naranja';
    return 'verde';
  }

  familiaLabel(f: number): string {
    const m: Record<number, string> = { 1: 'F1 Estratégico', 2: 'F2 Alta Rot.', 3: 'F3 Alto Costo', 4: 'F4 Bajo Rot.' };
    return m[f] ?? `F${f}`;
  }

  decisionColor(d: string): string {
    if (d === 'ACEPTADA')  return 'verde';
    if (d === 'AJUSTADA')  return 'amarillo';
    if (d === 'RECHAZADA') return 'rojo';
    return 'gris';
  }

  formatCOP(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  }

  goBack(): void {
    this.router.navigate(['/approvals']);
  }

  openApprove(): void {
    const d = this.detail();
    if (!d) return;
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'approve',
        titulo: 'Aprobar ítem',
        mensaje: `¿Confirma la aprobación de <strong>${d.producto_nombre}</strong> × ${d.cantidad_propuesta} unidades?`,
        comentarioRequerido: false,
        labelBtn: 'Aprobar',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe((result?: { comentario?: string }) => {
      if (result === undefined) return;
      this.acting.set(true);
      this.approvalService.approve(d.id, this.nivelActual(), result.comentario).subscribe(() => {
        this.acting.set(false);
        this.snackBar.open('✓ Ítem aprobado', '', { duration: 2000, panelClass: ['snack-success'] });
        setTimeout(() => this.router.navigate(['/approvals']), 300);
      });
    });
  }

  openReject(): void {
    const d = this.detail();
    if (!d) return;
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'reject',
        titulo: 'Rechazar ítem',
        mensaje: `Rechazar <strong>${d.producto_nombre}</strong>. El comentario es obligatorio (≥ 10 caracteres).`,
        comentarioRequerido: true,
        labelBtn: 'Confirmar Rechazo',
        colorBtn: 'warn',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe((result?: { comentario: string }) => {
      if (!result) return;
      this.acting.set(true);
      this.approvalService.reject(d.id, result.comentario).subscribe(() => {
        this.acting.set(false);
        this.snackBar.open('✗ Ítem rechazado', '', { duration: 2000 });
        setTimeout(() => this.router.navigate(['/approvals']), 300);
      });
    });
  }

  openReturn(): void {
    const d = this.detail();
    if (!d) return;
    const ref = this.dialog.open(ApprovalActionDialogComponent, {
      width: '480px',
      data: {
        action: 'return',
        titulo: 'Devolver a modificación',
        mensaje: `Devolver <strong>${d.producto_nombre}</strong> para ajuste. Indica qué debe corregirse.`,
        comentarioRequerido: true,
        labelBtn: 'Devolver',
      } as ApprovalActionDialogData,
    });
    ref.afterClosed().subscribe((result?: { comentario: string }) => {
      if (!result) return;
      this.acting.set(true);
      this.approvalService.returnToModify(d.id, result.comentario).subscribe(() => {
        this.acting.set(false);
        this.snackBar.open('↩ Ítem devuelto para modificación', '', { duration: 2000 });
        setTimeout(() => this.router.navigate(['/approvals']), 300);
      });
    });
  }
}
