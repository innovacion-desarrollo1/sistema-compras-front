export type DuanaRole = 'AUXILIAR_COMPRAS' | 'JEFE_COMPRAS' | 'GERENTE' | 'ADMIN';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  roles: DuanaRole[];
  comingSoon?: boolean;
  dividerBefore?: boolean;
}
