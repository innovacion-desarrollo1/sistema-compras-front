import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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
import { MoleculaService, Molecula } from '../../../../core/services/molecula.service';

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
    if (molecula.es_clase_c) return 'naranja'; // Clase C governance
    if (molecula.cobertura_dias === 0) return 'negro'; // Stockout
    if (molecula.cobertura_dias < 5) return 'rojo'; // Critical
    if (molecula.cobertura_dias < 10) return 'amarillo'; // Warning
    return 'verde'; // OK
  }

  getSemaphoreIcon(molecula: Molecula): string {
    if (molecula.es_clase_c) return 'gavel';
    if (molecula.cobertura_dias === 0) return 'block';
    if (molecula.cobertura_dias < 5) return 'priority_high';
    if (molecula.cobertura_dias < 10) return 'warning';
    return 'check_circle';
  }

  getSemaphoreText(molecula: Molecula): string {
    if (molecula.es_clase_c) return 'Clase C - Requiere Aprobación';
    if (molecula.cobertura_dias === 0) return 'Sin Stock';
    if (molecula.cobertura_dias < 5) return `CRÍTICO (${molecula.cobertura_dias.toFixed(1)} días)`;
    if (molecula.cobertura_dias < 10) return `Bajo (${molecula.cobertura_dias.toFixed(1)} días)`;
    return `OK (${molecula.cobertura_dias.toFixed(1)} días)`;
  }
}
