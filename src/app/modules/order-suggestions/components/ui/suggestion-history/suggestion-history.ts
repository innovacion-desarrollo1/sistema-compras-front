import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SuggestionHistoryService, HistoricalSuggestion } from '../../../../../core/services/suggestion-history.service';

@Component({
  selector: 'app-suggestion-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './suggestion-history.html',
  styleUrl: './suggestion-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuggestionHistory implements OnInit {
  suggestions: HistoricalSuggestion[] = [];
  filteredSuggestions: HistoricalSuggestion[] = [];
  
  dateRangeControl = new FormControl('30'); // 30/90/365 days
  decisionFilterControl = new FormControl('ALL'); // ALL/ACEPTADA/RECHAZADA/AJUSTADA
  searchControl = new FormControl('');

  isLoading = true;

  constructor(
    private historyService: SuggestionHistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.setupFilters();
  }

  loadHistory(): void {
    const days = parseInt(this.dateRangeControl.value || '30');
    this.historyService.getHistory(days).subscribe({
      next: (data) => {
        this.suggestions = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load history:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setupFilters(): void {
    this.dateRangeControl.valueChanges.subscribe(() => this.loadHistory());
    this.decisionFilterControl.valueChanges.subscribe(() => this.applyFilters());
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    let filtered = this.suggestions;

    // Decision type filter
    const decision = this.decisionFilterControl.value;
    if (decision !== 'ALL') {
      filtered = filtered.filter(s => s.decision === decision);
    }

    // Search filter (product name)
    const search = this.searchControl.value?.toLowerCase() || '';
    if (search) {
      filtered = filtered.filter(s => 
        s.producto_nombre.toLowerCase().includes(search)
      );
    }

    this.filteredSuggestions = filtered;
  }

  getDecisionColor(decision: string): string {
    if (decision === 'ACEPTADA') return 'verde';
    if (decision === 'RECHAZADA') return 'rojo';
    return 'amarillo'; // AJUSTADA
  }

  getDecisionIcon(decision: string): string {
    if (decision === 'ACEPTADA') return 'check_circle';
    if (decision === 'RECHAZADA') return 'cancel';
    return 'tune'; // AJUSTADA
  }

  exportToCSV(): void {
    const csvData = this.convertToCSV(this.filteredSuggestions);
    this.downloadCSV(csvData, 'suggestion-history.csv');
  }

  private convertToCSV(data: HistoricalSuggestion[]): string {
    const headers = ['Fecha Decisión', 'Producto', 'Cantidad Sugerida', 'Proveedor', 'Costo Total', 'Decisión', 'Usuario', 'Razón Rechazo'];
    const rows = data.map(s => [
      s.fecha_decision.toISOString(),
      s.producto_nombre,
      s.cantidad_sugerida,
      s.proveedor_nombre,
      s.costo_total,
      s.decision,
      s.usuario_nombre,
      s.razon_rechazo || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
