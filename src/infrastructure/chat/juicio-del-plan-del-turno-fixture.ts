import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import type { NewChatMessage } from '@domain/chat/chat-message'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { JuicioDelPlanDelTurno } from './juicio-del-plan-del-turno'

export const META = { durationMs: 1, startedAt: 0, endedAt: 1 }
const bloque = (intocable: string, alcance: string, razon: string): string =>
  `PLAN:{"ataca_la_causa":"SI","declara_tocar_lo_intocable":"${intocable}","alcance":"${alcance}","razon":"${razon}"}:END-PLAN` // prettier-ignore

export const DICE = {
  ADELANTE: bloque('NO', 'AJUSTADO', 'va a la causa'),
  REPLANTEA: bloque('SI', 'AMPLIO', 'toca el auth'),
  ILEGIBLE: 'me parece bien'
}

// prettier-ignore
const memoria = (id: string): FindingMemory => ({ id, identity: 'i', severity: 'HIGH', title: `t-${id}`, file: 'a.ts', line: 3, simbolo: null, status: 'open', lifecycle: 'ACTIVE' }) as FindingMemory

export const LOTE = ['f1', 'f2']
/** El turno de PLAN como sale del renderer: lista, sin foco, y `supervisado` A
 *  PROPOSITO —el camino real—, para que ningun test pase por fiarse del mensaje. */
export const TURNO_DE_PLAN: SendMessageInput = {
  projectId: 'p1',
  prompt: 'resuelve el lote',
  mode: 'supervisado',
  excludedAgents: [],
  lote: LOTE
}

/** El modo REAL en la base, el proyecto, la memoria, y el hilo donde se escribe. */
function contexto(modo: string, hilo: NewChatMessage[]): AppContext {
  return {
    settings: { get: (k: string) => (k === SETTINGS_KEYS.operationMode ? modo : null) },
    projects: { findById: (id: string) => (id === 'p1' ? { id: 'p1', path: '/p' } : null) },
    findings: { listMemory: () => LOTE.map(memoria) },
    runs: { record: () => {} },
    chat: { add: (m: NewChatMessage) => (hilo.push(m), m) }
  } as unknown as AppContext
}

export interface Banco {
  readonly d: JuicioDelPlanDelTurno
  readonly fases: () => readonly (string | undefined)[]
  readonly hilo: () => readonly NewChatMessage[]
  /** Cuantas veces se repropuso: cada una es un turno visible en el hilo. */
  readonly vueltas: () => number
}

/** El juicio guionizado: `dichos` es lo que OMEGA contesta en cada vuelta (el
 *  ultimo se repite). `reproponer` devuelve SIEMPRE el mismo texto —o sea que NO
 *  avanza—, porque el caso a provocar es el del productor dando vueltas. */
export function banco(
  modo: string,
  dichos: readonly string[],
  over: Partial<JuicioDelPlanDelTurno> = {}
): Banco {
  const fases: (string | undefined)[] = []
  const hilo: NewChatMessage[] = []
  const cola = [...dichos]
  let vueltas = 0
  let ultimo = dichos[dichos.length - 1] ?? DICE.ADELANTE
  const d: JuicioDelPlanDelTurno = {
    context: contexto(modo, hilo),
    input: TURNO_DE_PLAN,
    propuesta: 'primero las llaves, luego el sink',
    avisar: (p) => void fases.push(p.fase),
    omega: { run: () => ((ultimo = cola.shift() ?? ultimo), Promise.resolve({ ok: true, texto: ultimo, runMeta: META })) }, // prettier-ignore
    reproponer: () => ((vueltas += 1), Promise.resolve('el mismo plan de siempre')),
    ...over
  }
  return { d, fases: () => fases, hilo: () => hilo, vueltas: () => vueltas }
}
