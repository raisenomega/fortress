import type { Assistant } from '@domain/chat/assistant'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import type { SendMessageInput } from './send-message-types'

export const PROJECT = { id: 'p1', name: 'P', path: '/tmp/p', trusted: false } as Project

export function fakeContext(project: Project | null = PROJECT): {
  context: AppContext
  added: NewChatMessage[]
} {
  const added: NewChatMessage[] = []
  const context = {
    projects: { findById: () => project },
    corpus: { of: () => EMPTY_CORPUS },
    chat: {
      add: (m: NewChatMessage): ChatMessage => {
        added.push(m)
        return { ...m, id: `id${added.length}`, chatId: null, createdAt: '2026', pending: false }
      },
      listByProject: () => []
    },
    transaction: (fn: () => void) => fn(),
    runs: { record: () => {} },
    activity: { recordMany: () => {} }
  } as unknown as AppContext
  return { context, added }
}

export const assistantOf = (text: string): Assistant => ({
  stream: () => Promise.resolve({ text, refused: false, usage: EMPTY_USAGE })
})

export const NO_CLI: CodeAgent = {
  isAvailable: () => false,
  precheck: () => null,
  run: () => Promise.reject(new Error('no debe correr'))
}

export const input = (over: Partial<SendMessageInput> = {}): SendMessageInput => ({
  projectId: 'p1',
  prompt: 'hola',
  mode: 'supervisado',
  excludedAgents: [],
  ...over
})

export const noop = (): void => {}
export const never = (): boolean => false
