import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  ApprovalWorkflowService,
  AprobacionItem,
  AprobacionEstado,
} from '../../../../../core/services/approval-workflow.service';

@Component({
  selector: 'app-approval-workflow',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatStepperModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './approval-workflow.html',
  styleUrl: './approval-workflow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalWorkflow implements OnInit, OnDestroy {
  @Input() requestId?: number;
  @Output() approved = new EventEmitter<AprobacionItem>();
  @Output() rejected = new EventEmitter<AprobacionItem>();

  currentRequest: AprobacionItem | null = null;
  polling$?: Subscription;
  isLoading = true;

  constructor(
    private approvalService: ApprovalWorkflowService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.requestId) {
      this.loadRequestStatus(this.requestId);
      this.startPolling(this.requestId);
    }
  }

  ngOnDestroy(): void {
    this.polling$?.unsubscribe();
  }

  loadRequestStatus(id: number): void {
    this.isLoading = true;
    this.approvalService.getById(id).subscribe(req => {
      this.currentRequest = req;
      this.isLoading = false;
      this.cdr.markForCheck();
      if (req?.estado_aprobacion?.startsWith('APROBADO')) this.approved.emit(req);
      else if (req?.estado_aprobacion?.startsWith('RECHAZADO')) this.rejected.emit(req!);
    });
  }

  startPolling(id: number): void {
    this.polling$ = interval(10000)
      .pipe(switchMap(() => this.approvalService.getById(id)))
      .subscribe(req => {
        if (!req) return;
        this.currentRequest = req;
        this.cdr.markForCheck();
        if (!req.estado_aprobacion.startsWith('PENDIENTE')) {
          this.polling$?.unsubscribe();
          if (req.estado_aprobacion.startsWith('APROBADO')) this.approved.emit(req);
          else if (req.estado_aprobacion.startsWith('RECHAZADO')) this.rejected.emit(req);
        }
      });
  }

  getStepIndex(estado: AprobacionEstado): number {
    if (estado.startsWith('PENDIENTE')) return 1;
    return 2;
  }

  getEstadoColor(estado: AprobacionEstado): string {
    if (estado.startsWith('APROBADO'))  return 'verde';
    if (estado.startsWith('RECHAZADO')) return 'rojo';
    if (estado === 'MODIFICACION')      return 'amarillo';
    return 'naranja';
  }

  getEstadoIcon(estado: AprobacionEstado): string {
    if (estado.startsWith('APROBADO'))  return 'check_circle';
    if (estado.startsWith('RECHAZADO')) return 'cancel';
    if (estado === 'MODIFICACION')      return 'undo';
    return 'schedule';
  }

  motivoLabel(motivo: 'FAMILIA_1' | 'ALTO_COSTO'): string {
    return motivo === 'FAMILIA_1' ? 'Familia F1 Estratégico' : 'Costo > $50.000';
  }
}
