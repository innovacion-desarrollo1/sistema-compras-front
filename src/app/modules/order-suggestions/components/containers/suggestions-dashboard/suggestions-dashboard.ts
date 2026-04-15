import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { ProductSearch } from '../../ui/product-search/product-search';
import { OrderSuggestionCard } from '../../ui/order-suggestion-card/order-suggestion-card';
import { CostSimulationTable } from '../../ui/cost-simulation-table/cost-simulation-table';
import { SupplierRankingTableComponent } from '../../ui/supplier-ranking-table/supplier-ranking-table';
import { ApprovalWorkflow } from '../../ui/approval-workflow/approval-workflow';
import { SuggestionHistory } from '../../ui/suggestion-history/suggestion-history';
import { MoleculeInventoryInfo } from '../../ui/molecule-inventory-info/molecule-inventory-info';
import { CartView } from '../../ui/cart-view/cart-view';
import { Producto, SugerenciaOrden, SuggestionStateService } from '../../../services/suggestion-state.service';
import { Molecula } from '../../../../../core/services/molecula.service';
import { CartService } from '../../../../../core/services/cart.service';

@Component({
  selector: 'app-suggestions-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatBadgeModule,
    ProductSearch,
    OrderSuggestionCard,
    CostSimulationTable,
    SupplierRankingTableComponent,
    ApprovalWorkflow,
    SuggestionHistory,
    MoleculeInventoryInfo,
    CartView
  ],
  templateUrl: './suggestions-dashboard.html',
  styleUrl: './suggestions-dashboard.scss',
})
export class SuggestionsDashboard {
  // State flags
  selectedMolecula: Molecula | null = null;
  periodoSemanas: number = 4;
  selectedProduct: Producto | null = null;
  currentSuggestion: SugerenciaOrden | null = null;
  approvalRequestId: number | null = null;

  // View states
  showDemandForecast = false;
  showSupplierRanking = false;
  showSuggestionCard = false;
  showCostSimulation = false;
  showApprovalWorkflow = false;
  showCart = false;
  isLoading = false;

  constructor(
    private stateService: SuggestionStateService,
    public cartService: CartService
  ) {}

  // Event Handlers
  onMoleculaSelected(event: {molecula: Molecula, periodo_semanas: number}): void {
    console.log('Molécula seleccionada:', event.molecula, 'Periodo:', event.periodo_semanas, 'semanas');
    this.selectedMolecula = event.molecula;
    this.periodoSemanas = event.periodo_semanas;
    
    // Reset downstream state
    this.resetSuggestion();
    
    // Trigger dependent components
    this.showDemandForecast = true;
    this.showSupplierRanking = true; // Show supplier ranking immediately
  }

  // Cuando el usuario selecciona un proveedor (con bonificaciones aplicadas)
  onSupplierSelected(data: any): void {
    console.log('Proveedor seleccionado:', data);
    // La orden se genera cuando el usuario selecciona proveedor
    // data contiene: proveedor + bonificaciones aplicadas
    this._generateSuggestion(data);
  }

  private _generateSuggestion(supplierData: any): void {
    // Generación instantánea de orden basada en proveedor y bonificaciones
    this.isLoading = true;
    
    const mockSuggestion: SugerenciaOrden = {
      id: Math.floor(Math.random() * 10000),
      producto_id: 1, // TODO: link to actual product from molecula
      producto_nombre: this.selectedMolecula?.nombre || '',
      cantidad_sugerida: supplierData.cantidad_calculada || 300,
      unidad_medida: 'unidades',
      proveedor_id: supplierData.proveedor_id,
      proveedor_nombre: supplierData.proveedor_nombre,
      precio_unitario: supplierData.precio_unitario || 1000,
      costo_total: supplierData.costo_total_con_bonificaciones || 0,
      es_clase_c: this.selectedMolecula?.es_clase_c || false,
      estado_aprobacion: this.selectedMolecula?.es_clase_c ? 'PENDIENTE' : null,
      created_at: new Date()
    };
    
    this.currentSuggestion = mockSuggestion;
    this.stateService.updateSuggestion(mockSuggestion);
    this.showSuggestionCard = true;
    this.showCostSimulation = true;
    this.isLoading = false;
    
    if (mockSuggestion.es_clase_c) {
      this.showApprovalWorkflow = true;
      this.approvalRequestId = mockSuggestion.id ?? null;
    }
  }

  onSuggestionAccepted(suggestion: SugerenciaOrden): void {
    if (suggestion.es_clase_c && suggestion.estado_aprobacion !== 'APROBADO') {
      alert('No se puede aceptar sugerencia Clase C sin aprobación');
      return;
    }
    console.log('Sugerencia aceptada:', suggestion);
    alert(`Orden creada exitosamente: ${suggestion.cantidad_sugerida} ${suggestion.unidad_medida} de ${suggestion.producto_nombre}`);
    this.resetWorkflow();
  }

  onSuggestionAdjusted(data: { suggestion: SugerenciaOrden, newQuantity: number }): void {
    console.log('Sugerencia ajustada:', data);

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

  onAddedToCart(suggestion: SugerenciaOrden): void {
    console.log('Producto agregado al carrito:', suggestion);
    this.showCart = true;
  }

  /** Called when supplier-ranking-table adds an item directly to cart */
  onCartUpdated(): void {
    this.showCart = true;
  }

  resetSuggestion(): void {
    this.currentSuggestion = null;
    this.approvalRequestId = null;
    this.showSuggestionCard = false;
    this.showCostSimulation = false;
    this.showApprovalWorkflow = false;
  }

  onApprovalGranted(event: any): void {
    console.log('Approval granted:', event);
    if (this.currentSuggestion) {
      this.currentSuggestion.estado_aprobacion = 'APROBADO';
      alert('Aprobación concedida. Ahora puedes emitir la orden.');
    }
  }

  onApprovalDenied(event: any): void {
    console.log('Approval denied:', event);
    if (this.currentSuggestion) {
      this.currentSuggestion.estado_aprobacion = 'RECHAZADO';
      alert(`Aprobación rechazada: ${event.comentarios || 'Sin comentarios'}`);
      this.resetWorkflow();
    }
  }

  resetWorkflow(): void {
    this.selectedProduct = null;
    this.resetSuggestion();
    this.showDemandForecast = false;
    this.showSupplierRanking = false;
    this.stateService.resetState();
  }
}
