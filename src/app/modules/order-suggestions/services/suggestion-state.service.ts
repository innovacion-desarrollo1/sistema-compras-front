import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Producto {
  id: number;
  codigo: string;
  nombre_comercial: string;
  molecula: string;
  categoria_invima: string;
  familia: number;
  es_clase_c: boolean;
  stock_actual: number;
  unidad_medida: string;
}

export interface PrediccionDemanda {
  producto_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  demanda_predicha: number;
  intervalo_confianza_inferior: number;
  intervalo_confianza_superior: number;
  r2_score: number; // Model accuracy (0-1)
  familia: number;
}

export interface ProveedorRanking {
  proveedor_id: number;
  proveedor_nombre: string;
  nit: string;
  score_80_20: number; // Lower is better
  costo_neto_real: number; // After bonifications + discounts
  precio_lista: number;
  bonificacion_porcentaje: number;
  descuento_porcentaje: number;
  otif_porcentaje: number; // On-Time In-Full
  lt_compliance_porcentaje: number; // Lead Time compliance
  kpi_score: number; // (OTIF + LT) / 2
}

export interface SugerenciaOrden {
  id?: number; // Generated after save
  producto_id: number;
  producto_nombre: string;
  cantidad_sugerida: number;
  unidad_medida: string;
  proveedor_id: number;
  proveedor_nombre: string;
  precio_unitario: number;
  costo_total: number;
  es_clase_c: boolean;
  estado_aprobacion: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | null;
  created_at?: Date;
  created_by?: number;
}

export interface AprobacionRequest {
  id?: number;
  sugerencia_id: number;
  producto_id: number;
  cantidad: number;
  costo_estimado: number;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  solicitante_id: number;
  aprobador_id?: number;
  fecha_solicitud: Date;
  fecha_respuesta?: Date;
  notas?: string;
}

export interface SimulacionCosto {
  variacion_porcentaje: number; // -30, -20, -10, 0, +10, +20, +30
  cantidad: number;
  costo_unitario: number;
  costo_total: number;
  bonificacion_aplicada: boolean;
  tier_bonificacion?: string; // e.g., "8+2", "12+1"
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * SuggestionStateService
 * 
 * Centralized state management for Módulo 1 (Manual Order Suggestion Engine).
 * Uses Angular Signals for reactive state updates across components.
 * 
 * Workflow:
 * 1. User selects product → updateSelectedProduct()
 * 2. Load forecast → updateDemandForecast()
 * 3. Load supplier ranking → updateSupplierRanking()
 * 4. Generate suggestion → updateSuggestion()
 * 5. If Clase C → create approval request → updateApprovalRequest()
 * 6. Accept/Reject/Adjust → logDecision()
 */
@Injectable({
  providedIn: 'root' // Singleton service
})
export class SuggestionStateService {
  
  // ============================================================================
  // SIGNALS (Reactive State)
  // ============================================================================
  
  // Product Selection
  private _selectedProduct = signal<Producto | null>(null);
  selectedProduct = this._selectedProduct.asReadonly();
  
  // Demand Forecast
  private _demandForecast = signal<PrediccionDemanda | null>(null);
  demandForecast = this._demandForecast.asReadonly();
  
  // Supplier Ranking
  private _supplierRanking = signal<ProveedorRanking[]>([]);
  supplierRanking = this._supplierRanking.asReadonly();
  
  // Selected Supplier (best score or user override)
  private _selectedSupplier = signal<ProveedorRanking | null>(null);
  selectedSupplier = this._selectedSupplier.asReadonly();
  
  // Order Suggestion
  private _currentSuggestion = signal<SugerenciaOrden | null>(null);
  currentSuggestion = this._currentSuggestion.asReadonly();
  
  // Approval Request (if Clase C)
  private _approvalRequest = signal<AprobacionRequest | null>(null);
  approvalRequest = this._approvalRequest.asReadonly();
  
  // Cost Simulations (7 scenarios: ±30/20/10%)
  private _costSimulations = signal<SimulacionCosto[]>([]);
  costSimulations = this._costSimulations.asReadonly();
  
  // ============================================================================
  // COMPUTED SIGNALS (Derived State)
  // ============================================================================
  
  // Is product selected?
  hasProduct = computed(() => this._selectedProduct() !== null);
  
  // Is forecast loaded?
  hasForecast = computed(() => this._demandForecast() !== null);
  
  // Has supplier ranking?
  hasSuppliers = computed(() => this._supplierRanking().length > 0);
  
  // Has active suggestion?
  hasSuggestion = computed(() => this._currentSuggestion() !== null);
  
  // Needs approval? (Clase C products)
  needsApproval = computed(() => {
    const suggestion = this._currentSuggestion();
    return suggestion?.es_clase_c === true && suggestion?.estado_aprobacion === 'PENDIENTE';
  });
  
  // Is approved? (Can emit order)
  isApproved = computed(() => {
    const suggestion = this._currentSuggestion();
    if (!suggestion?.es_clase_c) return true; // Non-Class C always approved
    return suggestion?.estado_aprobacion === 'APROBADO';
  });
  
  // Is rejected?
  isRejected = computed(() => {
    const suggestion = this._currentSuggestion();
    return suggestion?.estado_aprobacion === 'RECHAZADO';
  });
  
  // Best supplier (lowest 80/20 score)
  bestSupplier = computed(() => {
    const suppliers = this._supplierRanking();
    if (suppliers.length === 0) return null;
    return suppliers.reduce((best, current) => 
      current.score_80_20 < best.score_80_20 ? current : best
    );
  });
  
  // ============================================================================
  // LEGACY OBSERVABLES (For components using RxJS)
  // ============================================================================
  
  private selectedProductSubject = new BehaviorSubject<Producto | null>(null);
  selectedProduct$ = this.selectedProductSubject.asObservable();
  
  private currentSuggestionSubject = new BehaviorSubject<SugerenciaOrden | null>(null);
  currentSuggestion$ = this.currentSuggestionSubject.asObservable();
  
  // ============================================================================
  // METHODS
  // ============================================================================
  
  /**
   * Update selected product (Step 1)
   */
  updateSelectedProduct(product: Producto | null): void {
    this._selectedProduct.set(product);
    this.selectedProductSubject.next(product);
    
    // Reset downstream state
    if (product === null) {
      this.resetState();
    } else {
      this._demandForecast.set(null);
      this._supplierRanking.set([]);
      this._selectedSupplier.set(null);
      this._currentSuggestion.set(null);
      this._approvalRequest.set(null);
      this._costSimulations.set([]);
    }
  }
  
  /**
   * Update demand forecast (Step 2)
   */
  updateDemandForecast(forecast: PrediccionDemanda | null): void {
    this._demandForecast.set(forecast);
  }
  
  /**
   * Update supplier ranking (Step 3)
   */
  updateSupplierRanking(suppliers: ProveedorRanking[]): void {
    // Sort by score_80_20 ascending (lower is better)
    const sorted = [...suppliers].sort((a, b) => a.score_80_20 - b.score_80_20);
    this._supplierRanking.set(sorted);
    
    // Auto-select best supplier
    if (sorted.length > 0) {
      this._selectedSupplier.set(sorted[0]);
    }
  }
  
  /**
   * Update selected supplier (user override)
   */
  updateSelectedSupplier(supplier: ProveedorRanking | null): void {
    this._selectedSupplier.set(supplier);
  }
  
  /**
   * Update order suggestion (Step 4)
   */
  updateSuggestion(suggestion: SugerenciaOrden | null): void {
    this._currentSuggestion.set(suggestion);
    this.currentSuggestionSubject.next(suggestion);
  }
  
  /**
   * Update approval request (Step 5 - if Clase C)
   */
  updateApprovalRequest(request: AprobacionRequest | null): void {
    this._approvalRequest.set(request);
  }
  
  /**
   * Update cost simulations (Step 6)
   */
  updateCostSimulations(simulations: SimulacionCosto[]): void {
    this._costSimulations.set(simulations);
  }
  
  /**
   * Adjust suggestion quantity (user override)
   */
  adjustQuantity(newQuantity: number): void {
    const current = this._currentSuggestion();
    if (!current) return;
    
    const adjusted: SugerenciaOrden = {
      ...current,
      cantidad_sugerida: newQuantity,
      costo_total: newQuantity * current.precio_unitario
    };
    
    this._currentSuggestion.set(adjusted);
    this.currentSuggestionSubject.next(adjusted);
  }
  
  /**
   * Reset all state (user clears workflow)
   */
  resetState(): void {
    this._selectedProduct.set(null);
    this._demandForecast.set(null);
    this._supplierRanking.set([]);
    this._selectedSupplier.set(null);
    this._currentSuggestion.set(null);
    this._approvalRequest.set(null);
    this._costSimulations.set([]);
    
    this.selectedProductSubject.next(null);
    this.currentSuggestionSubject.next(null);
  }
  
  /**
   * Get current workflow state summary
   */
  getWorkflowState() {
    return {
      hasProduct: this.hasProduct(),
      hasForecast: this.hasForecast(),
      hasSuppliers: this.hasSuppliers(),
      hasSuggestion: this.hasSuggestion(),
      needsApproval: this.needsApproval(),
      isApproved: this.isApproved(),
      isRejected: this.isRejected(),
      product: this._selectedProduct(),
      forecast: this._demandForecast(),
      suppliers: this._supplierRanking(),
      suggestion: this._currentSuggestion(),
      approval: this._approvalRequest(),
    };
  }
}
