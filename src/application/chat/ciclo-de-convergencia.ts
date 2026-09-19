import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import { planDelTerminal } from '@domain/chat/plan-del-terminal'
import { vetoComoPedido } from '@domain/chat/veto-como-pedido'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { conRedDeReversion, type TurnoProtegido } from './con-red-de-reversion'
import type { JuezDelTurno } from './juez-del-turno'
import type { Tribunal } from './tribunal-del-turno'
import type { ReplyOutcome } from './reply-outcome'

/** Un reintento: el veto de OMEGA como mensaje siguiente, sobre la MISMA sesion
 *  del productor (`--resume`, ADR-088 Enmienda 2), para que responda a la
 *  critica en vez de volver a probar a ciegas. */
export interface Reintento {
  readonly pedido: string
  readonly sesion: string | null
}

export interface CicloDeps {
  readonly red: RedDeReversion
  readonly cwd: string
  readonly foco: HallazgoAResolver
  readonly pedido: string
  readonly juez: JuezDelTurno
  /** El tribunal de la Fase B. Ausente = solo OMEGA (Fase A). */
  readonly tribunal?: Tribunal
  readonly producir: (reintento: Reintento | null) => Promise<ReplyOutcome>
}

export interface Convergencia {
  readonly turno: TurnoProtegido
  /** Falso solo cuando OMEGA veto y el reintento dejo de avanzar. */
  readonly convergio: boolean
  /** El ultimo veto, cuando no se convergio: es lo que se cuenta en Historia. */
  readonly razon: string | null
  readonly intentos: number
}

/**
 * Edita, deja que el gate y OMEGA lo miren, y si vetan REINTENTA — hasta
 * converger (ADR-090, Fase A). Nunca para el lote y NUNCA llama al humano: en
 * autonomo no hay a quien llamar, y detenerse a esperar seria supervisado con
 * otro nombre.
 *
 * CONVERGER NO ES UN CONTADOR. Se sigue mientras el trabajo AVANCE, y avanzar
 * se mide por la huella del diff: si un intento propone lo mismo que otro ya
 * vetado, el productor esta dando vueltas y una vuelta mas dara lo mismo. Ahi se
 * para —no por haber gastado un cupo, sino porque no hay progreso— y el hallazgo
 * sale como no resuelto CON la razon del ultimo veto.
 *
 * Cada intento abre su propio checkpoint: al revertir, el arbol vuelve a como
 * estaba y el siguiente empieza limpio. Nunca se acumulan dos intentos encima.
 */
export async function hastaConverger(deps: CicloDeps): Promise<Convergencia> {
  const plan = planDelTerminal(deps.foco, deps.pedido)
  const vistos = new Set<string>()
  let reintento: Reintento | null = null

  for (let intentos = 1; ; intentos += 1) {
    const turno = await conRedDeReversion(deps.red, deps.cwd, true, () => deps.producir(reintento), { juez: deps.juez, plan, tribunal: deps.tribunal }) // prettier-ignore
    const v = turno.veredicto
    if (!v.juzgado || v.aprobado) return { turno, convergio: true, razon: null, intentos }

    if (vistos.has(v.huella)) return { turno, convergio: false, razon: v.razon, intentos }
    vistos.add(v.huella)
    reintento = {
      pedido: vetoComoPedido(v.razon),
      sesion: turno.outcome.sesion ?? deps.foco.sesion
    }
  }
}
