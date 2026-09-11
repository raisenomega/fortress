import type { Severity } from '../shared/severity'
import type { FindingLifecycle } from './finding-lifecycle'
import type { FindingStatus } from './finding-status'

/**
 * Un hallazgo con lo que la base RECUERDA de el: su clave estable, su ciclo de
 * vida y sus fechas. Es la vista que necesita el motor para decidir con
 * historia en vez de con la foto de la ultima corrida.
 *
 * Se mantiene aparte de `Finding` a proposito: la UI muestra el hallazgo, no su
 * expediente, y no tiene por que cargar con estos campos.
 */
export interface FindingMemory {
  readonly id: string
  readonly identity: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
  /** El nombre del bloque donde vive el defecto, o `null` si no consta. Salio de
   *  la CLAVE en ADR-084 —no discriminaba— pero sigue siendo el dato con el que
   *  el analista encuentra el sitio cuando la linea ya se movio. */
  readonly simbolo: string | null
  readonly status: FindingStatus
  readonly lifecycle: FindingLifecycle
  /** Cuando se vio por primera vez. NUNCA se reescribe: es su historia. */
  readonly firstSeen: string
  /** Ultimo escaneo que lo nombro. Si es anterior al ultimo escaneo del
   *  proyecto, estuvo AUSENTE en esa corrida — que no es lo mismo que resuelto. */
  readonly lastSeen: string
  readonly resolvedAt: string | null
  /** Cuando el operador declaro que ya estaba arreglado, o null. Es la fecha
   *  desde la que se mira si su archivo volvio a cambiar. */
  readonly mitigatedAt: string | null
}
