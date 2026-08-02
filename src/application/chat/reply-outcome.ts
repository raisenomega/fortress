import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

/** Lo que produjo una respuesta, con la traza de lo que costo y lo que toco. */
export interface ReplyOutcome {
  readonly text: string
  readonly failed: boolean
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  readonly edits: readonly string[]
}

/** Respuesta de solo texto: no hay herramientas ni archivos tocados. */
export function textOnly(text: string, usage: TokenUsage = EMPTY_USAGE): ReplyOutcome {
  return { text, failed: false, usage, tools: [], edits: [] }
}
