export type SemaphoreColor = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'negro' | 'gris';

export interface SemaphoreInput {
  cobertura_dias: number;
  familia?: number | null;
  lt_sistema_dias?: number | null;
  /** @deprecated usar familia en su lugar */
  es_clase_c?: boolean;
}

export class SemaphoreHelper {
  /**
   * Prioridad HIS-009 CA-2/CA-3/CA-7:
   * NEGRO (cobertura=0) > ROJO (cobertura<LT) > NARANJA (familia=1) > AMARILLO (cobertura<1.5×LT) > VERDE
   */
  static getColor(data: SemaphoreInput): SemaphoreColor {
    const lt = data.lt_sistema_dias ?? 7;

    if (data.cobertura_dias === 0)              return 'negro';
    if (data.cobertura_dias < lt)              return 'rojo';
    if (data.familia === 1)                     return 'naranja';
    if (data.cobertura_dias < lt * 1.5)        return 'amarillo';
    return 'verde';
  }

  static getIcon(color: SemaphoreColor): string {
    const icons: Record<SemaphoreColor, string> = {
      negro:    'block',
      rojo:     'priority_high',
      naranja:  'gavel',
      amarillo: 'warning',
      verde:    'check_circle',
      gris:     'help_outline',
    };
    return icons[color];
  }

  static getText(data: SemaphoreInput): string {
    const lt = data.lt_sistema_dias ?? 7;
    const dias = data.cobertura_dias;

    if (dias === 0)         return 'Sin stock';
    if (dias < lt)          return `Crítico — ${dias}d cobertura`;
    if (data.familia === 1) return `F1 Estratégico — ${dias}d cobertura`;
    if (dias < lt * 1.5)    return `Bajo — ${dias}d cobertura`;
    return `OK — ${dias}d cobertura`;
  }

  static getLabel(color: SemaphoreColor): string {
    const labels: Record<SemaphoreColor, string> = {
      negro:    'Sin Stock',
      rojo:     'Crítico',
      naranja:  'F1 Estratégico',
      amarillo: 'Bajo',
      verde:    'OK',
      gris:     'Sin datos',
    };
    return labels[color];
  }
}
