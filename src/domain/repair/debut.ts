import type { Candidate } from './select-target'
import type { Severity } from '../shared/severity'

/**
 * Severidades que el motor puede tocar en modo ESTRENO. **LA ESCALERA, CON SU
 * CRITERIO:** cada escalon se paga con evidencia, nunca con una fecha.
 *
 * 1. **LOW** al nacer (ADR-007). Un motor recien nacido no se estrena sobre lo
 *    mas grave: «la confianza se gana con evidencia, no se declara».
 * 2. **MEDIUM** el 2026-08-08, tras UNA ejecucion auditada de punta a punta
 *    sobre un LOW (claude-account): eligio por superficie, VERIFICO antes de
 *    proponer —atrapando un hallazgo obsoleto— y paso por worktree + gate +
 *    OMEGA + firma humana.
 * 3. **HIGH** el 2026-09-30 (ADR-106), con el libro delante: 62 corridas del
 *    generador entregaron fix, 61 gates verdes, 51 aprobaciones de OMEGA y 28
 *    integraciones firmadas. **Ninguna siendo HIGH**: la propuesta que llegó a
 *    MERGEADO sobre un hallazgo que hoy es HIGH se trabajo siendo MEDIUM y subio
 *    despues (ADR-103 re-graduo 48 filas). Este escalon se paga con VOLUMEN
 *    sobre LOW y MEDIUM, no con un HIGH superado, y el ADR lo dice asi.
 * 4. **CRITICAL: pendiente, y su puerta ya tiene condicion** (ADR-106 §3.3).
 *    Entra cuando exista una propuesta de hallazgo HIGH en estado MERGEADO con
 *    los eventos `gate verde`, `omega aprobo` e `integracion firmada por el
 *    operador`, y con `created_at` POSTERIOR al sello de ADR-106. El corte por
 *    fecha no es formalismo: ya hay un HIGH con esa firma exacta
 *    (`created_at=1787495660174`, 19-ago) bajo la puerta vieja, y sin el corte
 *    la condicion naceria cumplida. La subida sera UNA linea con la firma del
 *    operador; NO se hace sola.
 *
 * Ampliar el estreno NO relaja ninguna red: el elegido sigue pasando por las
 * tres zonas y la firma. Y **no abre el auto-merge**, que es otra puerta: un
 * HIGH cuya politica no lo liste sigue exigiendo firma para integrarse
 * (`auto-merge-evaluation.ts`). Solo cambia sobre que puede TRABAJAR el motor.
 */
export const DEBUT: readonly Severity[] = ['LOW', 'MEDIUM', 'HIGH']

/** true si el hallazgo cae en el terreno que el motor tiene permitido estrenar. */
export function isDebutEligible(c: Candidate): boolean {
  return DEBUT.includes(c.severity)
}
