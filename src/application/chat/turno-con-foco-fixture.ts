import type { NewChatMessage } from '@domain/chat/chat-message'
import type { CodeAgent, CodeAgentReply, CodeAgentRequest } from '@domain/chat/code-agent'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import type { Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { fakeContext, input, noop, PROJECT } from './chat-test-fixtures'
import { HALLAZGOS } from './hallazgos-del-turno-fixture'
import { sendMessage } from './send-message'
import type { SendMessageInput, SendMessageOutput } from './send-message-types'

/** Lo que deja un turno: su resultado, lo que recibio el agente, lo guardado, y
 *  lo que el productor recordo u olvido de su hallazgo (ADR-088, Enmienda 2). */
export interface Turno {
  readonly r: Result<SendMessageOutput>
  readonly pedidos: CodeAgentRequest[]
  readonly added: NewChatMessage[]
  readonly recordadas: Array<{ id: string; sesion: string }>
  readonly olvidadas: string[]
}

/** La memoria de partida del hallazgo y lo que contesta el CLI de mentira, que
 *  puede depender de la peticion (un `--resume` roto contesta distinto). */
export interface Memoria {
  readonly sesion?: string | null
  readonly respuesta?: (pedido: CodeAgentRequest) => Partial<CodeAgentReply>
  /** El operador pulso Detener durante el turno: `isCancelled` contesta que si. */
  readonly detenido?: boolean
}

/** Red de ADR-079 siempre presente: el modo lo decide la regla, no la falta de git. */
const RED: RedDeReversion = {
  disponible: () => true,
  abrir: () => ({ conservar: () => true, revertir: () => true }),
  verificar: () => Promise.resolve('verde')
}

const HECHO: CodeAgentReply = { text: 'hecho', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] } // prettier-ignore

/** Un turno del Terminal en autonomo, proyecto de confianza, con el CLI de mentira:
 *  devuelve cada peticion que recibio el agente y lo que se guardo en el chat. */
export async function turno(
  over: Partial<SendMessageInput>,
  memoria: Memoria = {}
): Promise<Turno> {
  const pedidos: CodeAgentRequest[] = []
  const recordadas: Array<{ id: string; sesion: string }> = []
  const olvidadas: string[] = []
  const cli: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (pedido) => (pedidos.push(pedido), Promise.resolve({ ...HECHO, ...memoria.respuesta?.(pedido) })) // prettier-ignore
  }
  const { context, added } = fakeContext({ ...PROJECT, trusted: true, lastScan: null } as Project)
  const findings = {
    listMemory: () => HALLAZGOS.map((h) => h.memoria),
    listByProject: () => HALLAZGOS.map((h) => h.fila),
    sesionDelTerminal: () => memoria.sesion ?? null,
    recordarSesionDelTerminal: (id: string, sesion: string) => void recordadas.push({ id, sesion }),
    olvidarSesionDelTerminal: (id: string) => void olvidadas.push(id)
  }
  const ctx = { ...context, findings } as unknown as AppContext
  const envio = input({ mode: 'autonomo', ...over })
  const detenido = (): boolean => memoria.detenido === true
  const r = await sendMessage(ctx, null, cli, envio, noop, noop, detenido, () => false, RED)
  return { r, pedidos, added, recordadas, olvidadas }
}
