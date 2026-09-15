import type { NewChatMessage } from '@domain/chat/chat-message'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import type { Finding } from '@domain/project/finding'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { fakeContext, input, never, noop, PROJECT } from './chat-test-fixtures'
import { sendMessage } from './send-message'
import type { SendMessageInput, SendMessageOutput } from './send-message-types'

interface EnDosVistas {
  readonly memoria: FindingMemory
  readonly fila: Finding
}

/** Lo que deja un turno: su resultado, lo que recibio el agente y lo guardado. */
export interface Turno {
  readonly r: Result<SendMessageOutput>
  readonly pedidos: CodeAgentRequest[]
  readonly added: NewChatMessage[]
}

/** Un hallazgo en las DOS vistas de la base: la memoria del motor y la fila. */
function hallazgo(
  id: string,
  file: string,
  title: string,
  tipo: string,
  lifecycle = 'ACTIVE'
): EnDosVistas {
  const comun = { id, severity: 'CRITICAL', title, file, line: 12, status: 'open', lifecycle }
  return {
    memoria: { ...comun, identity: `${file}|12|${tipo}`, simbolo: 'x', firstSeen: '2026', lastSeen: '2026', resolvedAt: null, mitigatedAt: null } as FindingMemory, // prettier-ignore
    fila: { ...comun, mitigatedNote: null, verificacionNote: null, lastSeen: '2026' } as Finding
  }
}

const HALLAZGOS = [
  hallazgo('f-auth', 'src/auth/sesion.ts', 'La sesion no caduca nunca', 'autorizacion-ausente'),
  hallazgo('f-neutro', 'src/util/formato.ts', 'La fecha se formatea sin zona horaria', 'fecha-sin-zona'), // prettier-ignore
  hallazgo('f-mitigado', 'src/util/otro.ts', 'Ya arreglado', 'fecha-sin-zona', 'MITIGATED')
]

/** Red de ADR-079 siempre presente: el modo lo decide la regla, no la falta de git. */
const RED: RedDeReversion = {
  disponible: () => true,
  abrir: () => ({ conservar: () => true, revertir: () => true }),
  verificar: () => Promise.resolve(true)
}

/** Un turno del Terminal en autonomo, proyecto de confianza, con el CLI de mentira:
 *  devuelve cada peticion que recibio el agente y lo que se guardo en el chat. */
export async function turno(over: Partial<SendMessageInput>): Promise<Turno> {
  const pedidos: CodeAgentRequest[] = []
  const cli: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (pedido) => {
      pedidos.push(pedido)
      return Promise.resolve({ text: 'hecho', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] }) // prettier-ignore
    }
  }
  const { context, added } = fakeContext({ ...PROJECT, trusted: true, lastScan: null } as Project)
  const findings = {
    listMemory: () => HALLAZGOS.map((h) => h.memoria),
    listByProject: () => HALLAZGOS.map((h) => h.fila)
  }
  const ctx = { ...context, findings } as unknown as AppContext
  const envio = input({ mode: 'autonomo', ...over })
  const r = await sendMessage(ctx, null, cli, envio, noop, noop, never, () => false, RED)
  return { r, pedidos, added }
}
