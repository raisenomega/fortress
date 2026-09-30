import type { Proposal } from '@domain/repair/proposal'
import type { PlanResult } from './resultado-del-plan'

/**
 * La propuesta del plan, o null. SOLO para los tests, y por eso vive aparte de
 * `resultado-del-plan`: en produccion el motivo de la negativa viaja entero
 * (ADR-107), y un atajo asi a mano en `src/` volveria a perderlo —que es justo
 * lo que aquel tipo vino a arreglar—.
 */
export const propuesta = (r: PlanResult): Proposal | null => (r.ok ? r.proposal : null)
