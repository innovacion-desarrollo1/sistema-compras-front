import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProveedorService } from '../../core/services/proveedor.service';
import { ProveedorItem, ProveedorUpdate } from '../../core/models/proveedor.types';
import { EditProveedorDialogComponent } from './edit-proveedor-dialog.component';

type EstadoFilter  = 'todos' | 'activo' | 'inactivo' | 'bloqueado';
type EmpresaFilter = 'todos' | 'duana' | 'cosmitet' | 'ambas' | 'ninguna';
type TipoFilter    = '' | 'MEDICAMENTOS' | 'INSUMOS' | 'MEDICAMENTOS / INSUMOS' | 'sin-especificar';
type SortDir       = 'asc' | 'desc';

@Component({
  selector: 'app-proveedores-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  styleUrl: './proveedores-dashboard.component.scss',
  template: `
    <div class="page-wrap">

      <!-- Header con icono — patrón mat-card-title de sugerencias -->
      <div class="page-header">
        <div class="page-header-icon">
          <mat-icon>business</mat-icon>
        </div>
        <div>
          <h1 class="page-title">Proveedores</h1>
          <p class="page-subtitle">
            @if (loading()) { Cargando… }
            @else if (!loadError()) { {{ filteredItems().length }} de {{ allItems().length }} proveedores }
          </p>
        </div>
      </div>

      <!-- Card de filtros — misma elevación que mat-card en sugerencias -->
      <div class="filters-card">

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por nombre o código</mat-label>
          <input matInput [value]="searchText()" (input)="searchText.set($any($event.target).value)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <div class="filters-bar">

          <div class="filter-groups-main">

            <div class="filter-group">
              <span class="filter-label">Estado</span>
              <div class="chip-row">
                @for (opt of estadoOptions; track opt.value) {
                  <button type="button" class="filter-chip"
                    [class.active]="filterEstado() === opt.value"
                    (click)="filterEstado.set(opt.value)"
                  >{{ opt.label }}</button>
                }
              </div>
            </div>

            <div class="filter-group">
              <span class="filter-label">Empresa</span>
              <div class="chip-row">
                @for (opt of empresaOptions; track opt.value) {
                  <button type="button" class="filter-chip"
                    [class.active]="filterEmpresa() === opt.value"
                    (click)="filterEmpresa.set(opt.value)"
                  >{{ opt.label }}</button>
                }
              </div>
            </div>

            <div class="filter-group">
              <span class="filter-label">Tipo</span>
              <div class="chip-row">
                @for (opt of tipoOptions; track opt.value) {
                  <button type="button" class="filter-chip"
                    [class.active]="filterTipo() === opt.value"
                    (click)="filterTipo.set(opt.value)"
                  >{{ opt.label }}</button>
                }
              </div>
            </div>

          </div>

          @if (hasActiveFilters()) {
            <button type="button" class="filter-chip filter-chip-clear"
              style="align-self: center"
              (click)="clearFilters()">
              <mat-icon class="chip-icon">close</mat-icon>
              Limpiar filtros
            </button>
          }

        </div>
      </div>

      <!-- Skeleton de carga -->
      @if (loading()) {
        <div class="table-wrapper">
          <div class="skeleton-row skeleton-header-row">
            @for (w of [200,70,110,90,80,80]; track w) {
              <div class="sk" [style.width.px]="w"></div>
            }
            <div class="sk" style="flex: 1"></div>
          </div>
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              @for (w of [170,60,100,80,70,70]; track w) {
                <div class="sk" [style.width.px]="w"></div>
              }
              <div class="sk" style="flex: 1"></div>
            </div>
          }
        </div>
      }

      <!-- Error de carga -->
      @else if (loadError()) {
        <div class="table-wrapper">
          <div class="state-panel">
            <mat-icon class="state-icon">cloud_off</mat-icon>
            <p class="state-msg">No se pudieron cargar los proveedores.</p>
            <button mat-stroked-button (click)="loadData()">
              <mat-icon>refresh</mat-icon>
              Reintentar
            </button>
          </div>
        </div>
      }

      <!-- Tabla -->
      @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredItems()" style="width: 100%">

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef style="min-width: 220px">
                <span class="sort-th" [class.is-sorted]="sortCol() === 'nombre'" (click)="toggleSort('nombre')">
                  <mat-icon>store</mat-icon>Proveedor
                  <mat-icon class="sort-icon">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </span>
              </th>
              <td mat-cell *matCellDef="let p">
                <div style="font-weight: 500; color: var(--ink)">{{ p.nombre || p.nit }}</div>
                @if (p.nombre) {
                  <div style="font-size: 0.75rem; color: var(--ink-muted)">{{ p.nit }}</div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef>
                <span class="col-header"><mat-icon>toggle_on</mat-icon>Estado</span>
              </th>
              <td mat-cell *matCellDef="let p">
                <span class="badge"
                  [class.badge-activo]="p.activo && !p.bloqueado"
                  [class.badge-inactivo]="!p.activo && !p.bloqueado"
                  [class.badge-bloqueado]="!!p.bloqueado">
                  <mat-icon class="badge-icon">{{ p.bloqueado ? 'block' : p.activo ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ p.bloqueado ? 'Bloqueado' : p.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="empresa">
              <th mat-header-cell *matHeaderCellDef>
                <span class="col-header"><mat-icon>domain</mat-icon>Empresa</span>
              </th>
              <td mat-cell *matCellDef="let p" style="white-space: nowrap">
                @if (p.vende_a_duana) {
                  <span class="empresa-chip empresa-duana" style="margin-right: 4px">DUANA</span>
                }
                @if (p.vende_a_cosmitet) {
                  <span class="empresa-chip empresa-cosmitet">COSMITET</span>
                }
                @if (!p.vende_a_duana && !p.vende_a_cosmitet) {
                  <span style="color: var(--ink-muted)">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="monto_minimo">
              <th mat-header-cell *matHeaderCellDef style="text-align: right">
                <span class="sort-th" [class.is-sorted]="sortCol() === 'monto_minimo'" (click)="toggleSort('monto_minimo')" style="justify-content: flex-end">
                  <mat-icon>payments</mat-icon>Monto mínimo (COP)
                  <mat-icon class="sort-icon">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </span>
              </th>
              <td mat-cell *matCellDef="let p" style="font-variant-numeric: tabular-nums; text-align: right; color: var(--ink)">
                {{ p.monto_minimo != null ? (p.monto_minimo | number:'1.0-0') : '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="tiempo_entrega">
              <th mat-header-cell *matHeaderCellDef>
                <span class="col-header"><mat-icon>schedule</mat-icon>Tiempo de entrega</span>
              </th>
              <td mat-cell *matCellDef="let p" style="color: var(--ink-muted); font-size: 0.875rem">{{ p.tiempo_entrega || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="tipo_producto">
              <th mat-header-cell *matHeaderCellDef>
                <span class="col-header"><mat-icon>category</mat-icon>Tipo de producto</span>
              </th>
              <td mat-cell *matCellDef="let p" style="color: var(--ink-muted); font-size: 0.875rem">{{ formatTipo(p.tipo_producto) }}</td>
            </ng-container>

            <ng-container matColumnDef="ordenes">
              <th mat-header-cell *matHeaderCellDef style="text-align: center">
                <span class="col-header">
                  <mat-icon>receipt_long</mat-icon>
                  <span>
                    Órdenes de compra
                    <span class="col-sublabel">DUANA / COSMITET</span>
                  </span>
                </span>
              </th>
              <td mat-cell *matCellDef="let p" style="text-align: center">
                <span class="oc-pill oc-duana">{{ p.total_ordenes_duana }}</span>
                <span class="oc-pill oc-cosmitet">{{ p.total_ordenes_cosmitet }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="ultima_oc">
              <th mat-header-cell *matHeaderCellDef>
                <span class="sort-th" [class.is-sorted]="sortCol() === 'ultima_oc'" (click)="toggleSort('ultima_oc')">
                  <mat-icon>history</mat-icon>Última OC
                  <mat-icon class="sort-icon">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </span>
              </th>
              <td mat-cell *matCellDef="let p">
                @if (getUltimaOc(p); as fecha) {
                  <span style="font-size: 0.875rem; color: var(--ink-muted)"
                    [matTooltip]="fecha | date:'dd/MM/yyyy'"
                  >{{ formatRelative(fecha) }}</span>
                } @else {
                  <span style="color: var(--ink-muted)">—</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="openEdit(p)"
                  [matTooltip]="'Editar ' + (p.nombre || p.nit)">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td [colSpan]="columns.length" style="text-align: center">
                <div class="state-panel" style="padding: 40px 24px">
                  <mat-icon class="state-icon">search_off</mat-icon>
                  @if (hasActiveFilters() || searchText()) {
                    <p class="state-msg">Sin resultados para los filtros aplicados.</p>
                    <button mat-button (click)="clearAll()">Limpiar todo</button>
                  } @else {
                    <p class="state-msg">No hay proveedores registrados.</p>
                  }
                </div>
              </td>
            </tr>
          </table>
        </div>
      }

    </div>
  `,
})
export class ProveedoresDashboardComponent implements OnInit {
  private svc    = inject(ProveedorService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  readonly columns = [
    'nombre', 'activo', 'empresa', 'monto_minimo',
    'tiempo_entrega', 'tipo_producto', 'ordenes', 'ultima_oc', 'acciones',
  ];

  loading   = signal(true);
  loadError = signal(false);
  allItems  = signal<ProveedorItem[]>([]);

  searchText    = signal('');
  filterEstado  = signal<EstadoFilter>('todos');
  filterEmpresa = signal<EmpresaFilter>('todos');
  filterTipo    = signal<TipoFilter>('');
  sortCol       = signal<string>('');
  sortDir       = signal<SortDir>('asc');

  readonly estadoOptions: { value: EstadoFilter; label: string }[] = [
    { value: 'todos',     label: 'Todos'      },
    { value: 'activo',    label: 'Activos'    },
    { value: 'inactivo',  label: 'Inactivos'  },
    { value: 'bloqueado', label: 'Bloqueados' },
  ];

  readonly empresaOptions: { value: EmpresaFilter; label: string }[] = [
    { value: 'todos',    label: 'Todas'    },
    { value: 'duana',    label: 'DUANA'    },
    { value: 'cosmitet', label: 'COSMITET' },
    { value: 'ambas',    label: 'Ambas'    },
    { value: 'ninguna',  label: 'Ninguna'  },
  ];

  readonly tipoOptions: { value: TipoFilter; label: string }[] = [
    { value: '',                       label: 'Todos'        },
    { value: 'MEDICAMENTOS',           label: 'Medicamentos' },
    { value: 'INSUMOS',                label: 'Insumos'      },
    { value: 'MEDICAMENTOS / INSUMOS', label: 'Mixtos'       },
    { value: 'sin-especificar',        label: 'Sin tipo'     },
  ];

  filteredItems = computed(() => {
    let items = this.allItems();

    const q = this.searchText().trim().toLowerCase();
    if (q) {
      items = items.filter(p =>
        (p.nombre ?? '').toLowerCase().includes(q) ||
        p.nit.toLowerCase().includes(q)
      );
    }

    switch (this.filterEstado()) {
      case 'activo':    items = items.filter(p => p.activo && !p.bloqueado);  break;
      case 'inactivo':  items = items.filter(p => !p.activo && !p.bloqueado); break;
      case 'bloqueado': items = items.filter(p => !!p.bloqueado);             break;
    }

    switch (this.filterEmpresa()) {
      case 'duana':    items = items.filter(p => p.vende_a_duana); break;
      case 'cosmitet': items = items.filter(p => p.vende_a_cosmitet); break;
      case 'ambas':    items = items.filter(p => p.vende_a_duana && p.vende_a_cosmitet); break;
      case 'ninguna':  items = items.filter(p => !p.vende_a_duana && !p.vende_a_cosmitet); break;
    }

    const tipo = this.filterTipo();
    if (tipo === 'sin-especificar') {
      items = items.filter(p => !p.tipo_producto);
    } else if (tipo) {
      items = items.filter(p => p.tipo_producto === tipo);
    }

    const col = this.sortCol();
    if (col) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      items = [...items].sort((a, b) => {
        const av = col === 'ultima_oc'
          ? (this.getUltimaOc(a) ?? '')
          : String((a as any)[col] ?? '');
        const bv = col === 'ultima_oc'
          ? (this.getUltimaOc(b) ?? '')
          : String((b as any)[col] ?? '');
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * dir;
      });
    }

    return items;
  });

  hasActiveFilters = computed(() =>
    this.filterEstado()  !== 'todos' ||
    this.filterEmpresa() !== 'todos' ||
    this.filterTipo()    !== ''
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.svc.getAll().subscribe({
      next: items => {
        this.allItems.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  toggleSort(col: string): void {
    if (this.sortCol() === col) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
  }

  clearFilters(): void {
    this.filterEstado.set('todos');
    this.filterEmpresa.set('todos');
    this.filterTipo.set('');
  }

  clearAll(): void {
    this.clearFilters();
    this.searchText.set('');
  }

  getUltimaOc(p: ProveedorItem): string | null {
    const dates = [p.fecha_ultima_orden_duana, p.fecha_ultima_orden_cosmitet]
      .filter((d): d is string => !!d);
    if (!dates.length) return null;
    return dates.reduce((a, b) => a > b ? a : b);
  }

  formatRelative(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0)  return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 30)  return `hace ${days} días`;
    if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
    return `hace ${Math.floor(days / 365)} años`;
  }

  formatTipo(t: string | null): string {
    if (!t) return '—';
    const map: Record<string, string> = {
      'MEDICAMENTOS': 'Medicamentos',
      'INSUMOS': 'Insumos',
      'MEDICAMENTOS / INSUMOS': 'Med. / Ins.',
    };
    return map[t] ?? t;
  }

  openEdit(proveedor: ProveedorItem): void {
    this.dialog
      .open(EditProveedorDialogComponent, { data: proveedor, width: '440px' })
      .afterClosed()
      .subscribe((patch: ProveedorUpdate | null) => {
        if (!patch) return;
        this.svc.update(proveedor.nit, patch).subscribe({
          next: updated => {
            this.allItems.update(list =>
              list.map(p => p.nit === updated.nit ? updated : p)
            );
            this.snack.open('Proveedor actualizado', '', { duration: 2500 });
          },
          error: () => this.snack.open(
            'Error al guardar. Verifique su conexión e intente de nuevo.',
            'Reintentar',
            { duration: 6000 }
          ),
        });
      });
  }
}
