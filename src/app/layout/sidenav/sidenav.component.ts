import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, switchMap, startWith, map } from 'rxjs';
import { SidenavStateService } from '../../core/services/sidenav-state.service';
import { AuthService } from '../../core/services/auth.service';
import { ApprovalWorkflowService } from '../../core/services/approval-workflow.service';
import { NavItem, DuanaRole } from './nav-item.model';

const NAV_ITEMS: NavItem[] = [
  {
    id: 'order-suggestions',
    label: 'Sugerencias de Compra',
    icon: 'request_quote',
    route: '/order-suggestions',
    // JEFE_COMPRAS excluido — HIS-008: es redirigido a /approvals
    roles: ['AUXILIAR_COMPRAS', 'ADMIN'],
  },
  {
    id: 'approvals',
    label: 'Aprobaciones',
    icon: 'gavel',
    route: '/approvals',
    roles: ['JEFE_COMPRAS', 'GERENTE', 'ADMIN'],
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    icon: 'business',
    route: '/proveedores',
    roles: ['JEFE_COMPRAS', 'GERENTE', 'ADMIN'],
  },
  {
    id: 'centinela',
    label: 'Centinela',
    icon: 'sensors',
    roles: ['AUXILIAR_COMPRAS', 'JEFE_COMPRAS', 'GERENTE', 'ADMIN'],
    comingSoon: true,
    dividerBefore: true,
  },
  {
    id: 'traceability',
    label: 'Seguimiento de Órdenes de Compra',
    icon: 'timeline',
    route: '/traceability',
    roles: ['AUXILIAR_COMPRAS', 'JEFE_COMPRAS', 'GERENTE', 'ADMIN'],
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: 'settings',
    route: '/settings',
    roles: ['ADMIN'],
    dividerBefore: true,
  },
];

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule, MatBadgeModule, RouterLink],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent {
  protected navState      = inject(SidenavStateService);
  protected auth          = inject(AuthService);
  private router          = inject(Router);
  private approvalService = inject(ApprovalWorkflowService);

  collapsed = this.navState.collapsed;

  currentRole = computed<DuanaRole>(() => this.auth.getRole() ?? 'AUXILIAR_COMPRAS');

  private _allPending = toSignal(
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.approvalService.getPending()),
    ),
    { initialValue: [] },
  );

  pendingCount = computed(() => {
    const role  = this.currentRole();
    const items = this._allPending();
    if (role === 'GERENTE' || role === 'ADMIN') {
      return items.filter(i => i.estado_aprobacion === 'PENDIENTE_GERENTE').length;
    }
    if (role === 'JEFE_COMPRAS') {
      return items.filter(i => i.estado_aprobacion === 'PENDIENTE_JEFE').length;
    }
    return 0;
  });

  visibleItems = computed(() =>
    NAV_ITEMS.filter(item => item.roles.includes(this.currentRole()))
  );

  isActive(item: NavItem): boolean {
    return !!item.route && this.router.url.startsWith(item.route);
  }

  userInitials = computed(() => {
    const name = this.auth.getCurrentUser()?.nombre ?? 'Usuario';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  });

  userName = computed(() => this.auth.getCurrentUser()?.nombre ?? 'Usuario');

  roleLabel = computed(() => {
    const labels: Record<DuanaRole, string> = {
      AUXILIAR_COMPRAS: 'Aux. Compras',
      JEFE_COMPRAS:     'Jefe Compras',
      GERENTE:          'Gerente',
      ADMIN:            'Administrador',
    };
    return labels[this.currentRole()];
  });

  logout(): void {
    this.auth.logout();
  }
}
