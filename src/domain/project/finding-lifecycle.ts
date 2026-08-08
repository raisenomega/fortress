/**
 * Que le pasa al PROBLEMA a lo largo de los escaneos.
 *
 * Es ORTOGONAL a `status` (open / false_positive), que registra una decision
 * del OPERADOR —descartar un falso positivo— y no dice nada sobre si el
 * problema sigue en el codigo. Un hallazgo puede estar descartado y ACTIVE, o
 * abierto y EXTINCT. Mezclarlos haria que descartar pareciera arreglar.
 *
 *   ACTIVE     el problema esta ahi, lo haya nombrado o no el ultimo escaneo
 *   MITIGATED  hay un fix aplicado, falta confirmar que ya no aparece
 *   EXTINCT    ausencia confirmada con evidencia, no por una sola corrida
 *
 * Un hallazgo NO se borra nunca. Sin memoria no se puede distinguir "lo
 * arreglamos" de "el escaner no lo nombro esta vez", y esa confusion extinguio
 * en falso cuatro hallazgos que nadie habia tocado (2026-08-08): sus archivos
 * no cambiaron un byte entre los dos escaneos.
 */
export const FINDING_LIFECYCLES = ['ACTIVE', 'MITIGATED', 'EXTINCT'] as const

export type FindingLifecycle = (typeof FINDING_LIFECYCLES)[number]

export function isFindingLifecycle(value: unknown): value is FindingLifecycle {
  return typeof value === 'string' && (FINDING_LIFECYCLES as readonly string[]).includes(value)
}
