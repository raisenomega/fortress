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
  /** Calidad GENERAL (todas las dimensiones), o null si no hubo auditoria integral. */
  readonly generalQuality: number | null
  readonly lastScan: string | null
  readonly hasClaude: boolean
  readonly hasGraph: boolean
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
