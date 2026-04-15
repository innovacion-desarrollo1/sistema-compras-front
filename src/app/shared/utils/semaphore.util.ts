export type SemaphoreColor = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'negro' | 'gris';

export interface SemaphoreInput {
  cobertura_dias: number;
  es_clase_c?: boolean;
}

export class SemaphoreHelper {
  static getColor(data: SemaphoreInput): SemaphoreColor {
    if (data.es_clase_c) return 'naranja';
    if (data.cobertura_dias === 0) return 'negro';
    if (data.cobertura_dias < 5) return 'rojo';
    if (data.cobertura_dias < 10) return 'amarillo';
    return 'verde';
  }

  static getIcon(color: SemaphoreColor): string {
    const icons: Record<SemaphoreColor, string> = {
      naranja: 'gavel',
      negro: 'block',
      rojo: 'priority_high',
      amarillo: 'warning',
      verde: 'check_circle',
      gris: 'help_outline',
    };
    return icons[color];
  }

  static getText(data: SemaphoreInput): string {
    if (data.es_clase_c) return 'Clase C - Requiere Aprobación';
    if (data.cobertura_dias === 0) return 'Sin Stock';
    if (data.cobertura_dias < 5) return `CRÍTICO (${data.cobertura_dias.toFixed(1)} días)`;
    if (data.cobertura_dias < 10) return `Bajo (${data.cobertura_dias.toFixed(1)} días)`;
    return `OK (${data.cobertura_dias.toFixed(1)} días)`;
  }
}
