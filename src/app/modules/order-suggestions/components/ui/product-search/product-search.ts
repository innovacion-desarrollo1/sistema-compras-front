import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { ProductService } from '../../../../../core/services/product.service';
import { Molecula } from '../../../../../core/services/molecula.service';

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
    MatSelectModule,
  ],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearch implements OnInit {
  searchControl  = new FormControl('');
  periodoControl = new FormControl('4');

  filteredProductos$!: Observable<Molecula[]>;
  private pipeline$!: Observable<Molecula[]>;

  @Output() moleculaSelected = new EventEmitter<{ molecula: Molecula; periodo_semanas: number }>();

  periodos = [
    { value: '2',  label: '2 semanas' },
    { value: '4',  label: '4 semanas (1 mes)' },
    { value: '8',  label: '8 semanas (2 meses)' },
    { value: '12', label: '12 semanas (3 meses)' },
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.pipeline$ = this.searchControl.valueChanges.pipe(
      filter(q => typeof q === 'string' && q.trim().length >= 2),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.productService.searchProducts(query as string)),
    );
    this.filteredProductos$ = this.pipeline$;
  }

  displayFn(item: Molecula | string | null): string {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.nombre;
  }

  onProductoSelect(producto: Molecula): void {
    const periodo_semanas = parseInt(this.periodoControl.value ?? '4', 10);
    this.moleculaSelected.emit({ molecula: producto, periodo_semanas });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.filteredProductos$ = this.pipeline$;
  }
}
