import type { Severity } from '../shared/severity'

export interface Finding {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
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
  readonly lastScan: string | null
  readonly hasClaude: boolean
  readonly hasGraph: boolean
  readonly hasFortress: boolean
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
}
