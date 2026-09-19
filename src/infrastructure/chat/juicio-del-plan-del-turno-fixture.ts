import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import type { StepProgress } from '@application/workflow/step-progress'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { JuicioDelPlanDelTurno } from './juicio-del-plan-del-turno'

export const META = { durationMs: 1, startedAt: 0, endedAt: 1 }

const ADELANTE =
  'PLAN:{"ataca_la_causa":"SI","declara_tocar_lo_intocable":"NO","alcance":"AJUSTADO","razon":"ok"}:END-PLAN' // prettier-ignore
const REPLANTEA =
  'PLAN:{"ataca_la_causa":"SI","declara_tocar_lo_intocable":"SI","alcance":"AMPLIO","razon":"toca el auth"}:END-PLAN' // prettier-ignore

export const DICE = { ADELANTE, REPLANTEA, ILEGIBLE: 'me parece bien' }

/** Un hallazgo como lo recuerda la base: la misma forma que el resto del lote. */
// prettier-ignore
const memoria = (id: string): FindingMemory => ({ id, identity: 'i', severity: 'HIGH', title: `t-${id}`, file: 'a.ts', line: 3, simbolo: null, status: 'open', lifecycle: 'ACTIVE' }) as FindingMemory

export const LOTE = ['f1', 'f2']

/** El turno de PLAN tal como sale del renderer: lleva la lista y NO lleva foco.
 *  Y `mode: 'supervisado'` A PROPOSITO, que es el camino real —`planDelLote` lo
 *  manda asi aunque el proyecto corra solo—, para que ningun test pase por
 *  fiarse del mensaje. */
export const TURNO_DE_PLAN: SendMessageInput = {
  projectId: 'p1',
  prompt: 'resuelve el lote',
  mode: 'supervisado',
  excludedAgents: [],
  lote: LOTE
}

/** El contexto del main: el modo REAL en la base, el proyecto, y la memoria. */
export function contexto(modo: string): AppContext {
  return {
    settings: { get: (k: string) => (k === SETTINGS_KEYS.operationMode ? modo : null) },
    projects: { findById: (id: string) => (id === 'p1' ? { id: 'p1', path: '/p' } : null) },
    findings: { listMemory: () => LOTE.map(memoria) },
    runs: { record: () => {} }
  } as unknown as AppContext
}

/** Las deps del juicio, con lo que OMEGA contesta y los avisos a la vista. */
export function deps(
  modo: string,
  texto: string,
  over: Partial<JuicioDelPlanDelTurno> = {}
): { d: JuicioDelPlanDelTurno; fases: () => readonly (string | undefined)[] } {
  const fases: (string | undefined)[] = []
  const d: JuicioDelPlanDelTurno = {
    context: contexto(modo),
    input: TURNO_DE_PLAN,
    propuesta: 'primero las llaves, luego el sink',
    avisar: (p: StepProgress) => void fases.push(p.fase),
    omega: { run: () => Promise.resolve({ ok: true, texto, runMeta: META }) },
    ...over
  }
  return { d, fases: () => fases }
}
