import type { Candidate } from './select-target'
import type { Severity } from '../shared/severity'

/**
 * Severidades que el motor puede tocar en modo ESTRENO.
 *
 * Empezo en solo-LOW. Subio a MEDIUM el 2026-08-08, despues de que el motor
 * completara una ejecucion auditada de punta a punta sobre un LOW
 * (claude-account): eligio por superficie, VERIFICO antes de proponer —
 * atrapando un hallazgo obsoleto— y paso por worktree + gate + OMEGA + firma
 * humana. HIGH y CRITICAL siguen fuera: piden mas confianza acumulada.
 *
 * Ampliar el estreno NO relaja ninguna red: el elegido sigue pasando por las
 * tres zonas y la firma. Solo cambia sobre que puede trabajar el motor.
 */
export const DEBUT: readonly Severity[] = ['LOW', 'MEDIUM']

/** true si el hallazgo cae en el terreno que el motor tiene permitido estrenar. */
export function isDebutEligible(c: Candidate): boolean {
  return DEBUT.includes(c.severity)
}
