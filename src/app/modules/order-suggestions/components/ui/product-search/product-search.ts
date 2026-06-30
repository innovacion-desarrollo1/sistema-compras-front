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
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { ProductService } from '../../../../../core/services/product.service';
import { Molecula } from '../../../../../core/services/molecula.service';
import { SemaphoreHelper } from '../../../../../shared/utils/semaphore.util';

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
    MatSelectModule,
    ScrollingModule,
  ],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearch implements OnInit {
  searchControl  = new FormControl('');
  periodoControl = new FormControl('4'); // Default: 4 semanas

  filteredProductos$!: Observable<Molecula[]>;

  @Output() moleculaSelected = new EventEmitter<{ molecula: Molecula; periodo_semanas: number }>();

  periodos = [
    { value: '2',  label: '2 semanas' },
    { value: '4',  label: '4 semanas (1 mes)' },
    { value: '8',  label: '8 semanas (2 meses)' },
    { value: '12', label: '12 semanas (3 meses)' },
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.filteredProductos$ = this.searchControl.valueChanges.pipe(
      // HIS-009 CA-5: guard — no llamar API con menos de 2 caracteres
      filter(q => typeof q === 'string' && q.trim().length >= 2),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.productService.searchProducts(query as string)),
    );
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

  getSemaphoreColor(m: Molecula): string {
    return SemaphoreHelper.getColor({
      cobertura_dias:  m.cobertura_dias,
      familia:         m.familia,
      lt_sistema_dias: m.lt_sistema_dias,
    });
  }

  getSemaphoreIcon(m: Molecula): string {
    return SemaphoreHelper.getIcon(this.getSemaphoreColor(m) as any);
  }

  getSemaphoreText(m: Molecula): string {
    return SemaphoreHelper.getText({
      cobertura_dias:  m.cobertura_dias,
      familia:         m.familia,
      lt_sistema_dias: m.lt_sistema_dias,
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.filteredProductos$ = of([]);
  }
}
