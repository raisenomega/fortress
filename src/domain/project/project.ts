import type { DimensionScores } from '../score/dimension'
import type { Severity } from '../shared/severity'
import type { ConfigState } from './config-state'
import type { FindingStatus } from './finding-status'

export interface Finding {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
  /** Descartado por el operador o abierto. Solo lo abierto bloquea un push. */
  readonly status: FindingStatus
}

export interface Project {
  readonly id: string
  readonly name: string
  /** Ruta absoluta en el filesystem. */
  readonly path: string
  /** Stack auto-detectado al agregar el proyecto. */
  readonly stack: string
  readonly gitRemote: string | null
  readonly gitBranch: string | null
  /** Score FORTRESS 0-100. */
  readonly fortressScore: number
  /** Calidad GENERAL (global del score integral), o null si no hubo auditoria. */
  readonly generalQuality: number | null
  /** Score por dimension del ultimo audit integral (cada uno null = sin datos), o null. */
  readonly qualityDimensions: DimensionScores | null
  /** true si el ultimo score global quedo PARCIAL (alguna dimension sin datos). */
  readonly qualityPartial: boolean
  readonly lastScan: string | null
  readonly hasClaude: boolean
  /** Knowledge Graph indexado y conectable (codebase-memory). */
  readonly hasGraph: boolean
  /** Nodos/aristas del grafo y cuando se indexo, o null si no hay grafo. */
  readonly graphNodes: number | null
  readonly graphEdges: number | null
  readonly graphIndexedAt: string | null
  readonly hasFortress: boolean
  /**
   * Proyecto de confianza. Por defecto false: un repo no confiable NUNCA
   * auto-ejecuta sus scripts. Solo si es true el agente puede autoverificarse
   * (typecheck/lint/test), porque `npm run X` corre codigo del propio repo.
   */
  readonly trusted: boolean
  /**
   * Loop autonomo encendido para este proyecto. Por defecto false. Solo se puede
   * encender con topes de loop guardados y proyecto de confianza (ver LoopToggle).
   */
  readonly loopEnabled: boolean
  /** Circuit breaker (Capa 4): una auditoria lo dejo sucio; bloqueado hasta revision humana. */
  readonly contaminated: boolean
  readonly contaminationDetail: string | null
  /**
   * Ciclo de vida del marco de gobierno. PENDIENTE_CONFIGURACION: recien creado,
   * el chat solo hace la entrevista de configuracion. CONFIGURADO: marco aprobado
   * y escrito; el chat trabaja normal. Ver `config-state.ts`.
   */
  readonly configState: ConfigState
  readonly createdAt: string
}

/** Datos que aporta el operador al agregar un proyecto. */
export interface NewProject {
  readonly name: string
  readonly path: string
  readonly stack: string
  readonly gitRemote: string | null
  readonly gitBranch: string | null
  readonly hasClaude: boolean
  /** Omitido -> CONFIGURADO. El alta de proyecto VACIO lo fija en PENDIENTE. */
  readonly configState?: ConfigState
}
