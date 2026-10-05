import Anthropic from '@anthropic-ai/sdk'
import type { Assistant, AssistantReply, AssistantRequest } from '@domain/chat/assistant'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { modeloDeLaApi } from './modelo-de-la-api'

// El modelo NO es un id fijo (era 'claude-opus-5', un Opus mas viejo que la
// cima): es el alias del reparto, resuelto contra el catalogo de la API.
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

function usageOf(reply: Anthropic.Beta.BetaMessage): TokenUsage {
  return {
    inputTokens: reply.usage.input_tokens,
    outputTokens: reply.usage.output_tokens,
    cacheReadTokens: reply.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: reply.usage.cache_creation_input_tokens ?? 0,
    costUsd: 0,
    numTurns: 1
  }
}

export function createAnthropicAssistant(apiKey: string): Assistant {
  const client = new Anthropic({ apiKey })

  return {
    async stream(request: AssistantRequest, onChunk): Promise<AssistantReply> {
      const modelo = await modeloDeLaApi(client.models, MODELO_POR_ROL.chatApi)
      if (modelo === null) throw new Error(`La API no ofrece ningun modelo ${MODELO_POR_ROL.chatApi} a esta key.`) // prettier-ignore
      const stream = client.beta.messages.stream({
        model: modelo.id,
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
      return {
        text: textOf(reply),
        refused: reply.stop_reason === 'refusal',
        usage: usageOf(reply)
      }
    }
  }
}
