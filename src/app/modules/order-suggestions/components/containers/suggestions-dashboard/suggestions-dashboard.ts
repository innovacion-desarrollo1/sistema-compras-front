import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SidenavStateService } from '../../../../../core/services/sidenav-state.service';
import { ProductSearch } from '../../ui/product-search/product-search';
import { OrderSuggestionCard } from '../../ui/order-suggestion-card/order-suggestion-card';
import { CostSimulationTable } from '../../ui/cost-simulation-table/cost-simulation-table';
import { SupplierRankingTableComponent } from '../../ui/supplier-ranking-table/supplier-ranking-table';
import { ApprovalWorkflow } from '../../ui/approval-workflow/approval-workflow';
import { SuggestionHistory } from '../../ui/suggestion-history/suggestion-history';
import { SdrIdInventoryInfo } from '../../ui/sdr-id-inventory-info/sdr-id-inventory-info';
import { CartView } from '../../ui/cart-view/cart-view';
import { Producto, SugerenciaOrden, SuggestionStateService } from '../../../services/suggestion-state.service';
import { Molecula } from '../../../../../core/services/molecula.service';
import { Cart, CartService } from '../../../../../core/services/cart.service';
import { ProductService } from '../../../../../core/services/product.service';

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
    SdrIdInventoryInfo,
    CartView
  ],
  templateUrl: './suggestions-dashboard.html',
  styleUrl: './suggestions-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionsDashboard implements OnInit, OnDestroy {
  // Navegación lateral (shell)
  protected navState = inject(SidenavStateService);
  private bpo = inject(BreakpointObserver);
  protected isHandset = toSignal(
    this.bpo.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  private _nextSuggestionId = 0;
  // State flags
  selectedSdr: Molecula | null = null;
  periodoSemanas: number = 4;
  selectedProduct: Producto | null = null;
  currentSuggestion: SugerenciaOrden | null = null;
  approvalRequestId: number | null = null;

  // View states
  showSupplierRanking = false;
  showSuggestionCard = false;
  showCostSimulation = false;
  showApprovalWorkflow = false;
  showHistory = false;
  isLoading = false;
  inventoryLoading = false;
  inventoryError = false;

  // Carrito acoplado al fondo: colapsado por defecto, expandible
  cartExpanded = false;
  cart: Cart | null = null;
  private cartSub?: Subscription;

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  constructor(
    private stateService: SuggestionStateService,
    public cartService: CartService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
  ) {}

  // Event Handlers
  onSdrSelected(event: {molecula: Molecula, periodo_semanas: number}): void {
    this.selectedSdr = event.molecula;
    this.periodoSemanas = event.periodo_semanas;
    this.resetSuggestion();
    this.showSupplierRanking = true;
    // El detalle aún no llega: mostramos spinner en vez de renderizar el objeto
    // base en ceros como si fueran datos reales (causaba el "todo en 0").
    this.inventoryLoading = true;
    this.inventoryError = false;

    // Enrich with real inventory data from backend
    this.productService.getSdrDetail(event.molecula.codigo_sdr ?? event.molecula.codigo)
      .subscribe({
        next: detail => {
          if (detail?.sdr_id) {
            this.selectedSdr = this.productService.sdrDetailToMolecula(event.molecula, detail);
          } else {
            this.inventoryError = true;
          }
          this.inventoryLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          // 502/timeout de rotacion/dusoft tras reintento: no dejamos ceros mudos
          this.inventoryLoading = false;
          this.inventoryError = true;
          this.cdr.markForCheck();
        },
      });
  }

  retrySdrDetail(): void {
    if (this.selectedSdr) {
      this.onSdrSelected({ molecula: this.selectedSdr, periodo_semanas: this.periodoSemanas });
    }
  }

  // Cuando el usuario selecciona un proveedor (con bonificaciones aplicadas)
  onSupplierSelected(data: any): void {
    console.log('Proveedor seleccionado:', data);
    // La orden se genera cuando el usuario selecciona proveedor
    // data contiene: proveedor + bonificaciones aplicadas
    this._generateSuggestion(data);
  }

  private _generateSuggestion(supplierData: any): void {
    this.isLoading = true;

    const precioUnitario: number = supplierData.precio_unitario || 1000;
    const familia: number = this.selectedSdr?.familia ?? 4;
    const requiereGerente = familia === 1 || precioUnitario > 50_000;

    // Cantidad OFICIAL (Política v7.2): viene de POST /api/v1/suggestions/calculate vía
    // supplierData.cantidad_calculada (sembrada desde la cantidad del backend en
    // supplier-ranking-table). Ya no se usa el placeholder 300.
    const suggestion: SugerenciaOrden = {
      id: ++this._nextSuggestionId,
      producto_id: this.selectedSdr?.codigo_sdr ?? this.selectedSdr?.codigo ?? '',
      producto_nombre: this.selectedSdr?.nombre || '',
      cantidad_sugerida: supplierData.cantidad_calculada ?? 0,
      unidad_medida: 'unidades',
      proveedor_id: supplierData.proveedor_id,
      proveedor_nombre: supplierData.proveedor_nombre,
      precio_unitario: precioUnitario,
      costo_total: supplierData.costo_total_con_bonificaciones || 0,
      es_clase_c: requiereGerente,
      requiere_aprobacion_gerente: requiereGerente,
      estado_aprobacion: requiereGerente ? 'PENDIENTE_GERENTE' : 'PENDIENTE_JEFE',
      created_at: new Date(),
    };

    this.currentSuggestion = suggestion;
    this.stateService.updateSuggestion(suggestion);
    this.showSuggestionCard = true;
    this.showCostSimulation = true;
    this.isLoading = false;

    if (suggestion.requiere_aprobacion_gerente) {
      this.showApprovalWorkflow = true;
      this.approvalRequestId = suggestion.id ?? null;
    }
  }

  onSuggestionAccepted(suggestion: SugerenciaOrden): void {
    if (suggestion.requiere_aprobacion_gerente && !suggestion.estado_aprobacion?.startsWith('APROBADO')) {
      alert('No se puede aceptar sugerencia que requiere aprobación sin haberla recibido');
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
  }

  /** Called when supplier-ranking-table adds an item directly to cart */
  onCartUpdated(): void {
    // Cart sidebar auto-updates via reactive subscription
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
      this.currentSuggestion.estado_aprobacion = 'APROBADO_GERENTE';
      alert('Aprobación concedida. Ahora puedes emitir la orden.');
    }
  }

  onApprovalDenied(event: any): void {
    console.log('Approval denied:', event);
    if (this.currentSuggestion) {
      this.currentSuggestion.estado_aprobacion = 'RECHAZADO_GERENTE';
      alert(`Aprobación rechazada: ${event.comentarios || 'Sin comentarios'}`);
      this.resetWorkflow();
    }
  }

  resetWorkflow(): void {
    this.selectedProduct = null;
    this.resetSuggestion();
    this.showSupplierRanking = false;
    this.stateService.resetState();
  }
}
