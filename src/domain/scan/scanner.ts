import type { Result } from '../shared/result'
import type { TokenUsage } from '../telemetry/token-usage'
import type { DetectedFinding } from './detected-finding'

export interface ScanRequest {
  /** Carpeta del proyecto: el escaneo se ejecuta dentro de ella. */
  readonly projectPath: string
  readonly projectName: string
  /** De quien es el proceso que se va a lanzar, para que una parada de OTRO
   *  proyecto no se lo lleve por delante. */
  readonly projectId: string
  /**
   * A que carpetas se acota ESTA pasada. Ausente = el proyecto entero, que es
   * como escaneaba antes de las paradas (ADR-082).
   *
   * Es una frontera BLANDA: se le pide al agente en el prompt, igual que se le
   * pide ignorar `node_modules`, y no hay flag del CLI que la imponga. El `cwd`
   * sigue en la raiz —el grafo, el corpus y la identidad de los hallazgos
   * dependen de ella—. Quien la verifica despues es el manifiesto.
   */
  readonly rutas?: readonly string[]
}

export interface ScanOutcome {
  readonly findings: readonly DetectedFinding[]
  readonly durationMs: number
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  /** Rutas escritas. Un escaneo en modo plan no deberia traer ninguna. */
  readonly edits: readonly string[]
}

/**
 * Puerto del escaner. El dominio no sabe que detras hay un proceso `claude`
 * leyendo el repo; solo que algo devuelve hallazgos o explica por que no pudo.
 */
export interface Scanner {
  /** Falso si la herramienta que escanea no esta instalada. */
  isAvailable(): boolean
  /** Motivo por el que no se puede escanear esa carpeta, o null si todo va bien. */
  precheck(projectPath: string): string | null
  scan(request: ScanRequest, onProgress: (delta: string) => void): Promise<Result<ScanOutcome>>
}
