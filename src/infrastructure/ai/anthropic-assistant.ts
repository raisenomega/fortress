import Anthropic from '@anthropic-ai/sdk'
import type { Assistant, AssistantReply, AssistantRequest } from '@domain/chat/assistant'

/** Claude Opus 5: piensa por defecto, asi que max_tokens cubre razonamiento + texto. */
export const CHAT_MODEL = 'claude-opus-5'
const MAX_TOKENS = 64000

/**
 * Fallback de servidor: si los clasificadores declinan la peticion, la API la
 * reencamina sola al modelo recomendado en vez de devolver un rechazo seco.
 */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01'

function textOf(reply: Anthropic.Beta.BetaMessage): string {
  return reply.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

export function createAnthropicAssistant(apiKey: string): Assistant {
  const client = new Anthropic({ apiKey })

  return {
    async stream(request: AssistantRequest, onChunk): Promise<AssistantReply> {
      const stream = client.beta.messages.stream({
        model: CHAT_MODEL,
        max_tokens: MAX_TOKENS,
        system: request.system,
        messages: request.turns.map((turn) => ({ role: turn.role, content: turn.content })),
        betas: [FALLBACK_BETA],
        fallbacks: 'default'
      })

      stream.on('text', onChunk)
      const reply = await stream.finalMessage()

      // Hay que mirar stop_reason antes que el contenido: en un rechazo puede
      // venir vacio o truncado.
      return { text: textOf(reply), refused: reply.stop_reason === 'refusal' }
    }
  }
}
