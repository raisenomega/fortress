import { chocaEnLaCorrida, type ColisionEnLaCorrida } from '@domain/repair/orden-de-firma'
import type { AppContext } from '../context'
import { expedienteDeTanda } from './tanda-de-firma'

export interface RegistroDeColisiones {
  readonly colisiones: ColisionEnLaCorrida[]
  /** Solo para las que ATERRIZAN espera-firma: las demas no tocan el arbol. */
  anotar(proposalId: string): Promise<void>
}

/**
 * El registro de ficheros tocados en UNA corrida del drenaje, y la senal cuando
 * una propuesta pisa lo de otra. Lee los ficheros del libro (`expedienteDeTanda`,
 * el evento GENERATE ya escrito antes del gate), compara con `chocaEnLaCorrida` y
 * anota. No juzga, no frena, no toca el arbol vivo: observacion pura.
 */
export function registroDeColisiones(ctx: AppContext): RegistroDeColisiones {
  const tocadoPor = new Map<string, readonly string[]>()
  const colisiones: ColisionEnLaCorrida[] = []
  return {
    colisiones,
    async anotar(proposalId: string): Promise<void> {
      const { files } = expedienteDeTanda(await ctx.eventLog.list(proposalId))
      const overlap = chocaEnLaCorrida(files, [...tocadoPor.keys()])
      if (overlap.length > 0) {
        const yaTocadosPor = [...new Set(overlap.flatMap((f) => tocadoPor.get(f) ?? []))]
        colisiones.push({ proposalId, ficheros: overlap, yaTocadosPor })
      }
      for (const f of files) tocadoPor.set(f, [...(tocadoPor.get(f) ?? []), proposalId])
    }
  }
}
