import type { Severity } from '../shared/severity'
import type { CheckFamily } from './scan-depth'

/**
 * Hallazgo de exposicion externa. Lleva evidencia y fix a proposito: sin
 * evidencia es una sospecha, y sin fix el operador sabe que esta mal pero no
 * que hacer. Los dos campos son la diferencia entre asustar y ayudar.
 */
export interface PostureFinding {
  readonly family: CheckFamily
  readonly severity: Severity
  readonly title: string
  /** Lo observado, con el dato real (valor del header, codigo HTTP...). */
  readonly evidence: string
  readonly fix: string
}
