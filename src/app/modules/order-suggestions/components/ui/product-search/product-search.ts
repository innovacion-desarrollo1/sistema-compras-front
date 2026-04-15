import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
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
import { Observable } from 'rxjs';
import { debounceTime, switchMap, startWith } from 'rxjs/operators';
import { MoleculaService, Molecula } from '../../../../../core/services/molecula.service';
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
    ScrollingModule
  ],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSearch implements OnInit {
  searchControl = new FormControl('');
  periodoControl = new FormControl('4'); // Default: 4 semanas
  filteredMoleculas$!: Observable<Molecula[]>;
  
  @Output() moleculaSelected = new EventEmitter<{molecula: Molecula, periodo_semanas: number}>();

  periodos = [
    { value: '2', label: '2 semanas' },
    { value: '4', label: '4 semanas (1 mes)' },
    { value: '8', label: '8 semanas (2 meses)' },
    { value: '12', label: '12 semanas (3 meses)' }
  ];

  constructor(private moleculaService: MoleculaService) {}

  ngOnInit(): void {
    this.filteredMoleculas$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300), // Esperar 300ms después de que el usuario deja de escribir
      switchMap(query => this._filterMoleculas(query || ''))
    );
  }

  private _filterMoleculas(query: string): Observable<Molecula[]> {
    if (typeof query === 'object') {
      return this.moleculaService.searchMoleculas('');
    }
    return this.moleculaService.searchMoleculas(query);
  }

  displayFn(molecula: Molecula | string): string {
    if (typeof molecula === 'string') return molecula;
    return molecula ? `${molecula.nombre}` : '';
  }

  onMoleculaSelect(molecula: Molecula): void {
    const periodo_semanas = parseInt(this.periodoControl.value || '4');
    this.moleculaSelected.emit({ molecula, periodo_semanas });
  }

  getSemaphoreColor(molecula: Molecula): string {
    return SemaphoreHelper.getColor({ cobertura_dias: molecula.cobertura_dias, es_clase_c: molecula.es_clase_c });
  }

  getSemaphoreIcon(molecula: Molecula): string {
    const color = SemaphoreHelper.getColor({ cobertura_dias: molecula.cobertura_dias, es_clase_c: molecula.es_clase_c });
    return SemaphoreHelper.getIcon(color);
  }

  getSemaphoreText(molecula: Molecula): string {
    return SemaphoreHelper.getText({ cobertura_dias: molecula.cobertura_dias, es_clase_c: molecula.es_clase_c });
  }
}
