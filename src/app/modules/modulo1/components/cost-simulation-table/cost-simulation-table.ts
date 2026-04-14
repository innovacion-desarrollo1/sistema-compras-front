import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CostSimulationService, CostScenario } from '../../../../core/services/cost-simulation.service';

@Component({
  selector: 'app-cost-simulation-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cost-simulation-table.html',
  styleUrl: './cost-simulation-table.scss'
})
export class CostSimulationTable implements OnInit, OnChanges {
  @Input() productoId!: number;
  @Input() baseQuantity!: number;
  @Input() proveedorId: number = 1; // Default supplier
  
  @Output() scenarioSelected = new EventEmitter<number>(); // Emits selected quantity

  scenarios: CostScenario[] = [];
  displayedColumns: string[] = ['scenario', 'cantidad', 'costo_unitario', 'bonificacion', 'costo_total'];
  isLoading = true;

  constructor(private costSimService: CostSimulationService) {}

  ngOnInit(): void {
    if (this.productoId && this.baseQuantity) {
      this.loadScenarios();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload scenarios when base quantity changes
    if (changes['baseQuantity'] && !changes['baseQuantity'].firstChange) {
      this.loadScenarios();
    }
  }

  loadScenarios(): void {
    this.isLoading = true;
    this.costSimService.getSimulation(this.productoId, this.baseQuantity, this.proveedorId)
      .subscribe({
        next: (data) => {
          this.scenarios = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load cost simulation:', err);
          this.isLoading = false;
        }
      });
  }

  onRowClick(scenario: CostScenario): void {
    console.log('[Cost Simulation] Scenario selected:', scenario);
    this.scenarioSelected.emit(scenario.cantidad);
  }

  getRowClass(scenario: CostScenario): string {
    if (scenario.is_base) return 'base-scenario';
    if (scenario.bonification_tier_active) return 'tier-active';
    return '';
  }

  getBonificationIcon(scenario: CostScenario): string {
    return scenario.bonification_tier_active ? 'check_circle' : 'remove_circle';
  }
}
