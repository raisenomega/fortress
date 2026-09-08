import type { DetectedFinding } from './detected-finding'

/**
 * El umbral que TAXONOMIA-DE-DEFECTOS fijo y nadie medía: por encima de esto,
 * `otro` deja de ser un destino legitimo y pasa a ser la senal de que al
 * vocabulario le falta un tipo.
 */
export const UMBRAL_DE_OTRO = 0.15

export interface TermometroDeOtro {
  readonly otros: number
  readonly total: number
  /** Fraccion, no porcentaje: 0.33 son 33 de cada 100. */
  readonly proporcion: number
  readonly superaUmbral: boolean
}

/**
 * Cuanto de este escaneo el escaner no supo clasificar (ADR-081).
 *
 * Devuelve `null` cuando no hay ningun `otro`: nada que anotar, y un asiento
 * diciendo "0%" en cada escaneo limpio enterraria el Libro.
 *
 * Mide sobre lo REPORTADO en la corrida, no sobre el expediente: es la eleccion
 * de este escaner en esta pasada lo que se esta calibrando, y las filas viejas
 * arrastran el vocabulario con el que se escribieron.
 */
export function termometroDeOtro(findings: readonly DetectedFinding[]): TermometroDeOtro | null {
  const otros = findings.filter((f) => f.tipo === 'otro').length
  if (otros === 0) return null

  const proporcion = otros / findings.length
  return { otros, total: findings.length, proporcion, superaUmbral: proporcion > UMBRAL_DE_OTRO }
}
