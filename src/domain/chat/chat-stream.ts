/** Fragmento de una respuesta que aun se esta generando. */
export interface ChatChunk {
  readonly projectId: string
  readonly delta: string
}

/** Avance del workflow para el medidor en vivo. */
export interface ChatProgress {
  readonly projectId: string
  readonly index: number
  readonly total: number
  readonly tokens: number
  readonly costUsd: number
}
