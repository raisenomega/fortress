import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'
import type { PropuestaDeTanda } from '@domain/repair/orden-de-firma'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalState } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import { texto, ultimo } from './lectura-del-libro'

export interface PropuestaEnCola extends PropuestaDeTanda {
  /** La rama del fix, para la sonda. Sin rama legible no se puede sondar. */
  readonly branch: string | null
}

/** Los MISMOS dos estados que la pagina de Firma: gate verde esperando juicio
 *  (GATE) o aprobada esperando integracion (OMEGA). Una cola, un criterio. */
const ESPERAN: ReadonlySet<ProposalState> = new Set(['GATE', 'OMEGA'])

/**
 * Rama y ficheros del fix, leidos del libro SIN exigir el veredicto: la cola
 * de firma tiene propuestas en GATE, y en GATE aun no hay juicio que pedir.
 * `collectPostOmegaState` exige el expediente entero y aqui seria pedir de
 * mas: la guia solo necesita saber DONDE vive cada fix.
 */
export function expedienteDeTanda(events: readonly ProposalEvent[]): {
  branch: string | null
  files: readonly string[]
} {
  const decision = ultimo(events, 'GENERATE', 'DECISION', MOTIVO_WORKTREE) as Record<string, unknown> | undefined // prettier-ignore
  const salida = ultimo(events, 'GENERATE', 'TRANSITION') as Record<string, unknown> | undefined
  const files = Array.isArray(salida?.files) ? (salida.files as string[]) : []
  return { branch: texto(decision?.branch), files }
}

/** La cola de firma del proyecto, con lo que la guia y la sonda necesitan. */
export async function propuestasDeTanda(
  ctx: AppContext,
  projectId: string
): Promise<readonly PropuestaEnCola[]> {
  const cola = ctx.repairProposals.listByProject(projectId).filter((p) => ESPERAN.has(p.state))
  const out: PropuestaEnCola[] = []
  for (const propuesta of cola) {
    const { branch, files } = expedienteDeTanda(await ctx.eventLog.list(propuesta.id))
    out.push({ id: propuesta.id, files, branch })
  }
  return out
}
