import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
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
import { ApprovalWorkflowService, ApprovalRequest } from '../../../../core/services/approval-workflow.service';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './approval-workflow.html',
  styleUrl: './approval-workflow.scss'
})
export class ApprovalWorkflow implements OnInit, OnDestroy {
  @Input() requestId?: number;
  @Output() approved = new EventEmitter<ApprovalRequest>();
  @Output() rejected = new EventEmitter<ApprovalRequest>();
  
  currentRequest: ApprovalRequest | null = null;
  polling$?: Subscription;
  isLoading = true;

  constructor(private approvalService: ApprovalWorkflowService) {}

  ngOnInit(): void {
    if (this.requestId) {
      this.loadRequestStatus(this.requestId);
      this.startPolling(this.requestId);
    }
  }

  ngOnDestroy(): void {
    if (this.polling$) {
      this.polling$.unsubscribe();
    }
  }

  loadRequestStatus(id: number): void {
    this.isLoading = true;
    this.approvalService.getRequest(id).subscribe({
      next: (req) => {
        this.currentRequest = req;
        this.isLoading = false;
        
        // Emit events based on status
        if (req.estado === 'APROBADO') {
          this.approved.emit(req);
        } else if (req.estado === 'RECHAZADO') {
          this.rejected.emit(req);
        }
      },
      error: (err) => {
        console.error('Failed to load approval request:', err);
        this.isLoading = false;
      }
    });
  }

  startPolling(id: number): void {
    this.polling$ = interval(10000) // Poll every 10 seconds
      .pipe(switchMap(() => this.approvalService.getRequest(id)))
      .subscribe({
        next: (req) => {
          this.currentRequest = req;
          if (req.estado !== 'PENDIENTE') {
            this.polling$?.unsubscribe(); // Stop polling when decided
            
            if (req.estado === 'APROBADO') {
              this.approved.emit(req);
            } else if (req.estado === 'RECHAZADO') {
              this.rejected.emit(req);
            }
          }
        }
      });
  }

  getStepIndex(estado: string): number {
    if (estado === 'PENDIENTE') return 1;
    return 2; // APROBADO or RECHAZADO
  }

  getEstadoColor(estado: string): string {
    if (estado === 'APROBADO') return 'verde';
    if (estado === 'RECHAZADO') return 'rojo';
    return 'amarillo'; // PENDIENTE
  }

  getEstadoIcon(estado: string): string {
    if (estado === 'APROBADO') return 'check_circle';
    if (estado === 'RECHAZADO') return 'cancel';
    return 'schedule'; // PENDIENTE
  }
}
