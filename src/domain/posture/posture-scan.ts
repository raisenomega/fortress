import type { PostureFinding } from './posture-finding'

/** Lo que produce un escaneo de exposicion, para la UI y el reporte. */
export interface PostureResult {
  readonly host: string
  readonly score: number
  readonly findings: readonly PostureFinding[]
  readonly durationMs: number
  readonly at: string
}

export interface PostureRequest {
  readonly url: string
  readonly depth: import('./scan-depth').ScanDepth
  /** El operador confirma que el sitio es suyo o tiene permiso. */
  readonly owned: boolean
}
