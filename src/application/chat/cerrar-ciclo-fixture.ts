import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { AppContext } from '../context'
import { bench, hallazgo, type Bench, type Opciones } from '../repair/plan-repair-fixture'
import type { TurnoProtegido } from './con-red-de-reversion'
import { textOnly } from './reply-outcome'

export const RAIZ = '/repo/p1'
export const HEAD = 'abc123def4567'

/** La respuesta ya guardada del turno: la que la nota cita. */
// prettier-ignore
export const RESPUESTA: ChatMessage = { id: 'm-1', projectId: 'p1', role: 'assistant', content: 'hecho', agentId: null, mode: 'autonomo', engine: 'claude-code', createdAt: '2026', pending: false }

/** Un turno que la red conservo, con las ediciones que se le pidan. */
export const turnoVerde = (
  edits: readonly string[],
  over: Partial<TurnoProtegido> = {}
): TurnoProtegido => ({ outcome: { ...textOnly('hecho'), edits }, aviso: '', conservado: true, revertido: false, ...over }) // prettier-ignore

/** El OBSOLETO con marcador, y un fichero de hoy que SI lo prueba o que NO. */
const OBSOLETO = { verdictStatus: 'OBSOLETO', evidencia: { marcador: 'execFile(', forma: 'ausente' } } as const // prettier-ignore
export const CON_PRUEBA: Partial<Opciones> = { ...OBSOLETO, contenido: 'await runCommand("npm")' }
export const SIN_PRUEBA: Partial<Opciones> = { ...OBSOLETO, contenido: 'execFile("npm")' }

export type BancoDelCierre = Bench & { readonly mensajes: NewChatMessage[] }

/**
 * El banco del motor con UNA diferencia que aqui importa: marcar mitigado CAMBIA
 * la fila y solo desde ACTIVE, como el UPDATE real. Sin eso la verificacion
 * veria el hallazgo mitigado antes de que nadie lo marcara, y el orden —marcar
 * y DESPUES verificar— no se probaria. Y guarda lo que el turno escribe al chat.
 */
export function banco(
  opts: Partial<Opciones> = {},
  inicial: FindingMemory = hallazgo('f1', 'src/api.ts')
): BancoDelCierre {
  const b = bench({ findings: [], sha: HEAD, ...opts })
  const real = b.context.findings
  let fila = inicial
  const findings = {
    ...real,
    listMemory: () => [fila],
    markMitigated: (id: string, note: string, at: string): boolean => {
      if (fila.lifecycle !== 'ACTIVE') return false
      fila = { ...fila, lifecycle: 'MITIGATED', mitigatedAt: at }
      return real.markMitigated(id, note, at)
    }
  }
  const mensajes: NewChatMessage[] = []
  const chat = { add: (m: NewChatMessage) => (mensajes.push(m), { ...m, id: 'm-sis', createdAt: '2026', pending: false }) } // prettier-ignore
  return { ...b, mensajes, context: { ...b.context, findings, chat } as unknown as AppContext }
}
