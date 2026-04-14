import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductSearch } from '../product-search/product-search';
import { DemandForecastChart } from '../demand-forecast-chart/demand-forecast-chart';
import { OrderSuggestionCard } from '../order-suggestion-card/order-suggestion-card';
import { CostSimulationTable } from '../cost-simulation-table/cost-simulation-table';
import { Producto, SugerenciaOrden, SuggestionStateService } from '../../services/suggestion-state.service';

@Component({
  selector: 'app-module1-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ProductSearch,
    DemandForecastChart,
    OrderSuggestionCard,
    CostSimulationTable
  ],
  templateUrl: './module1-dashboard.html',
  styleUrl: './module1-dashboard.scss',
})
export class Module1Dashboard {
  // State flags
  selectedProduct: Producto | null = null;
  currentSuggestion: SugerenciaOrden | null = null;
  approvalRequestId: number | null = null;

  // View states
  showDemandForecast = false;
  showSupplierRanking = false;
  showSuggestionCard = false;
  showCostSimulation = false;
  showApprovalWorkflow = false;
  isLoading = false;

  constructor(private stateService: SuggestionStateService) {}

  // Event Handlers
  onProductSelected(producto: Producto): void {
    console.log('Product selected:', producto);
    this.selectedProduct = producto;
    this.stateService.updateSelectedProduct(producto);
    
    // Reset downstream state
    this.resetSuggestion();
    
    // Trigger dependent components (will implement these next)
    this.showDemandForecast = true;
    this.showSupplierRanking = true;
    this.showSuggestionCard = true; // Simulate suggestion generation
    
    // TODO: Generate actual suggestion from backend
    this._mockGenerateSuggestion(producto);
  }

  private _mockGenerateSuggestion(producto: Producto): void {
    // Simulate API call delay
    this.isLoading = true;
    setTimeout(() => {
      const mockSuggestion: SugerenciaOrden = {
        id: Math.floor(Math.random() * 10000),
        producto_id: producto.id,
        producto_nombre: producto.nombre_comercial,
        cantidad_sugerida: Math.floor(Math.random() * 500) + 100,
        unidad_medida: producto.unidad_medida,
        proveedor_id: 1,
        proveedor_nombre: 'Proveedor Demo SA',
        precio_unitario: Math.random() * 5000 + 1000,
        costo_total: 0, // Will calculate
        es_clase_c: producto.es_clase_c,
        estado_aprobacion: producto.es_clase_c ? 'PENDIENTE' : null,
        created_at: new Date()
      };
      
      mockSuggestion.costo_total = mockSuggestion.cantidad_sugerida * mockSuggestion.precio_unitario;
      
      this.currentSuggestion = mockSuggestion;
      this.stateService.updateSuggestion(mockSuggestion);
      this.showSuggestionCard = true;
      this.showCostSimulation = true;
      this.isLoading = false;
      
      if (mockSuggestion.es_clase_c) {
        this.showApprovalWorkflow = true;
      }
    }, 1000);
  }

  onSuggestionAccepted(suggestion: SugerenciaOrden): void {
    if (suggestion.es_clase_c && suggestion.estado_aprobacion !== 'APROBADO') {
      alert('No se puede aceptar sugerencia Clase C sin aprobación');
      return;
    }
    console.log('Suggestion accepted:', suggestion);
    // TODO: Emit order to ERP
    alert(`Orden creada exitosamente: ${suggestion.cantidad_sugerida} ${suggestion.unidad_medida} de ${suggestion.producto_nombre}`);
    this.resetWorkflow();
  }

  onSuggestionAdjusted(data: { suggestion: SugerenciaOrden, newQuantity: number }): void {
    console.log('Suggestion adjusted:', data);
    // TODO: Recalculate with new quantity
    if (this.currentSuggestion) {
      this.currentSuggestion.cantidad_sugerida = data.newQuantity;
      this.currentSuggestion.costo_total = data.newQuantity * this.currentSuggestion.precio_unitario;
      this.stateService.adjustQuantity(data.newQuantity);
    }
  }

  onScenarioSelected(newQuantity: number): void {
    console.log('[Dashboard] Cost scenario selected with quantity:', newQuantity);
    // Adjust suggestion with selected quantity
    if (this.currentSuggestion) {
      this.onSuggestionAdjusted({ 
        suggestion: this.currentSuggestion, 
        newQuantity 
      });
    }
  }

  onSuggestionRejected(data: { suggestion: SugerenciaOrden, reason: string }): void {
    console.log('Suggestion rejected:', data);
    // TODO: Log rejection to audit trail
    alert(`Sugerencia rechazada: ${data.reason}`);
    this.resetWorkflow();
  }

  resetSuggestion(): void {
    this.currentSuggestion = null;
    this.approvalRequestId = null;
    this.showSuggestionCard = false;
    this.showCostSimulation = false;
    this.showApprovalWorkflow = false;
  }

  resetWorkflow(): void {
    this.selectedProduct = null;
    this.resetSuggestion();
    this.showDemandForecast = false;
    this.showSupplierRanking = false;
    this.stateService.resetState();
  }
}
