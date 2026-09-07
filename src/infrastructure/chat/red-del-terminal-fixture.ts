import type { AppContext } from '@application/context'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput, SendMessageOutput } from '@application/chat/send-message-types'
import type { NewChatMessage } from '@domain/chat/chat-message'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'

/** De confianza y configurado: lo unico que deja al autonomo seguir siendo autonomo. */
export const proyectoEn = (path: string): Project =>
  ({
    id: 'p1',
    name: 'P',
    path,
    trusted: true,
    lastScan: null,
    configState: 'CONFIGURADO'
  }) as Project

export function contexto(project: Project): { context: AppContext; textos: string[] } {
  const textos: string[] = []
  const context = {
    projects: { findById: () => project },
    corpus: { of: () => EMPTY_CORPUS },
    findings: { listByProject: () => [] },
    chat: {
      add: (m: NewChatMessage) => {
        textos.push(m.content)
        return { ...m, id: `id${textos.length}`, createdAt: '2026', pending: false }
      },
      listByProject: () => []
    },
    transaction: (fn: () => void) => fn(),
    runs: { record: () => {} },
    activity: { recordMany: () => {} }
  } as unknown as AppContext
  return { context, textos }
}

/** Lo que devuelve el agente cuando encuentra un CRITICAL: el paso con puerta para ahi. */
export const CRITICAL = '```json\n{"findings":[{"severity":"CRITICAL","title":"Secreto en claro","file":"a.txt","line":1}]}\n```' // prettier-ignore

// prettier-ignore
export function enviar(context: AppContext, cli: CodeAgent, over: Partial<SendMessageInput>, red: RedDeReversion, cancelado = false): Promise<Result<SendMessageOutput>> {
  const input: SendMessageInput = { projectId: 'p1', prompt: 'hola', mode: 'autonomo', excludedAgents: [], ...over }
  return sendMessage(context, null, cli, input, () => {}, () => {}, () => cancelado, () => false, red)
}
