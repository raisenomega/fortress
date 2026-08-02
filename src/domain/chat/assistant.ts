import type { TokenUsage } from '../telemetry/token-usage'

export interface AssistantTurn {
  readonly role: 'user' | 'assistant'
  readonly content: string
}

export interface AssistantRequest {
  readonly system: string
  /** Conversacion completa del proyecto, en orden. */
  readonly turns: readonly AssistantTurn[]
}

export interface AssistantReply {
  readonly text: string
  /** El modelo declino la peticion (stop_reason "refusal"). */
  readonly refused: boolean
  /**
   * Tokens de la llamada. El coste va a cero a proposito: la API devuelve
   * consumo, no dinero, y aqui no se inventa una tarifa. Solo Claude Code
   * reporta `total_cost_usd`.
   */
  readonly usage: TokenUsage
}

/**
 * Puerto del modelo de lenguaje. El dominio no sabe que detras hay Anthropic:
 * la implementacion vive en infrastructure/ai.
 */
export interface Assistant {
  stream(request: AssistantRequest, onChunk: (delta: string) => void): Promise<AssistantReply>
}
