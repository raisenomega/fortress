import type { ChatMessage } from '@domain/chat/chat-message'
import { SIN_JUZGAR } from '@domain/chat/veredicto-del-turno'
import type { TurnoProtegido } from './con-red-de-reversion'
import { textOnly } from './reply-outcome'

/** Un turno que se intento y se deshizo: lo que deja un ciclo sin converger. */
export const REVERTIDO: TurnoProtegido = {
  outcome: { ...textOnly('lo intente'), edits: [] },
  aviso: '',
  conservado: false,
  revertido: true,
  veredicto: SIN_JUZGAR
}

export const RESPUESTA = { id: 'm1', projectId: 'p1', mode: 'autonomo', engine: 'claude-code' } as ChatMessage // prettier-ignore

/** Recoge lo que se anota en la FILA y lo que se dice en el HILO: los dos sitios
 *  donde el operador tiene que enterarse de que no salio. */
export function contexto(): { ctx: never; notas: string[]; hilo: string[] } {
  const notas: string[] = []
  const hilo: string[] = []
  const ctx = {
    findings: {
      anotarVerificacion: (_id: string, nota: string) => (notas.push(nota), true),
      sesionDelTerminal: () => null,
      recordarSesionDelTerminal: () => true
    },
    projects: { findById: () => ({ id: 'p1', path: '/p', name: 'P' }) },
    chat: { add: (m: { content: string }) => (hilo.push(m.content), { id: 'x' }) }
  }
  return { ctx: ctx as never, notas, hilo }
}
