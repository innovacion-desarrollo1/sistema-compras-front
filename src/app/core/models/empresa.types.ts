export type EmpresaCompradora = 'DUANA' | 'COSMITET';

export const EMPRESA_LABELS: Record<EmpresaCompradora, string> = {
  DUANA: 'Duana',
  COSMITET: 'Cosmitet',
};

// ponytail: CSS class map — avoids spreading brand colors in every component
export const EMPRESA_BADGE_CLASS: Record<EmpresaCompradora, string> = {
  DUANA: 'empresa-duana',
  COSMITET: 'empresa-cosmitet',
};
