import type { ConfigState } from '@domain/repair/auto-merge-config'

/**
 * Lo que el DISCO de un proyecto contesta sobre si mismo: su cerco declarado, la
 * huella de ese cerco y si es el repo de FORTRESS.
 *
 * Salen del contexto a su propia familia porque son la misma pregunta hecha tres
 * veces —«que dice este arbol»— y porque `AppContext` llego a su techo de
 * lineas. El corte se hace por familia y no por tamano: quien venga a anadir una
 * sonda nueva encuentra aqui a sus hermanas.
 */
export interface LecturasDelDisco {
  /** El cerco `.fortress/config` que declara el proyecto: ausente, bien o ilegible (ADR-102 §4). */
  readonly fortressConfig: (projectPath: string) => ConfigState
  /** La huella de ese cerco: es ella —y no el HEAD— la que levanta la pausa. */
  readonly huellaDeConfig: (projectPath: string) => string
  /** Si es el repo de FORTRESS: solo ahi trabaja el Motor (ADR-107). */
  readonly esRepoPropio: (projectPath: string) => boolean
}
