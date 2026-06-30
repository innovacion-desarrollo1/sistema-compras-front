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
import { SidenavStateService } from '../../core/services/sidenav-state.service';
import { AuthService } from '../../core/services/auth.service';
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
    roles: ['JEFE_COMPRAS', 'GERENTE', 'ADMIN', 'AUXILIAR_COMPRAS'],
    comingSoon: true, // HIS-008: habilitar cuando se implemente la funcionalidad de aprobaciones
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
    roles: ['AUXILIAR_COMPRAS', 'JEFE_COMPRAS', 'GERENTE', 'ADMIN'],
    comingSoon: true,
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
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule, RouterLink],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent {
  protected navState = inject(SidenavStateService);
  protected auth     = inject(AuthService);
  private router     = inject(Router);

  collapsed = this.navState.collapsed;

  currentRole = computed<DuanaRole>(() => this.auth.getRole() ?? 'AUXILIAR_COMPRAS');

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
