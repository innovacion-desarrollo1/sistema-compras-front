import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Observable } from 'rxjs';
import { debounceTime, switchMap, startWith } from 'rxjs/operators';
import { Producto } from '../../services/suggestion-state.service';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    ScrollingModule
  ],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
})
export class ProductSearch implements OnInit {
  searchControl = new FormControl('');
  filteredProducts$!: Observable<Producto[]>;
  
  @Output() productSelected = new EventEmitter<Producto>();

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.filteredProducts$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300), // Wait 300ms after user stops typing
      switchMap(query => this._filterProducts(query || ''))
    );
  }

  private _filterProducts(query: string): Observable<Producto[]> {
    if (typeof query === 'object') {
      return this.productService.searchProducts('');
    }
    return this.productService.searchProducts(query);
  }

  displayFn(producto: Producto | string): string {
    if (typeof producto === 'string') return producto;
    return producto ? `${producto.nombre_comercial} - ${producto.molecula}` : '';
  }

  onProductSelect(producto: Producto): void {
    this.productSelected.emit(producto);
  }

  getSemaphoreColor(producto: Producto): string {
    if (producto.es_clase_c) return 'naranja'; // Governance alert
    if (producto.stock_actual === 0) return 'negro'; // Stockout
    if (producto.stock_actual <= 100) return 'rojo'; // Critical (assuming min stock ~100)
    if (producto.stock_actual <= 300) return 'amarillo'; // Warning
    return 'verde'; // OK
  }

  getSemaphoreIcon(producto: Producto): string {
    if (producto.es_clase_c) return 'warning';
    if (producto.stock_actual === 0) return 'block';
    if (producto.stock_actual <= 100) return 'priority_high';
    return 'check_circle';
  }
}
