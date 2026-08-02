/** Fragmento de una respuesta que aun se esta generando. */
export interface ChatChunk {
  readonly projectId: string
  readonly delta: string
}
