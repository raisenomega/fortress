/** Fragmento de progreso de un escaneo en curso, del main al renderer. */
export interface ScanChunk {
  readonly projectId: string
  readonly delta: string
}
