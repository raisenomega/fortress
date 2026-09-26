import type { AppContext } from '@application/context'
import type { Parada } from './loop-stop-record'
import type { Track } from './loop-track'

/** La sesion persistida tal como va: viva o parada, con lo que el track lleva. */
export function persistirSesion(
  context: AppContext,
  projectId: string,
  track: Track,
  baseline: number
): (active: boolean, parada?: Parada | null) => void {
  return (active, parada) =>
    context.loopSessions.save({
      ...track,
      projectId,
      active,
      spentBaseline: baseline,
      updatedAt: '',
      ...(parada ?? {})
    })
}
