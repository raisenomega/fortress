import type { Severity } from '../shared/severity'
import type { FindingLifecycle } from './finding-lifecycle'
import type { FindingStatus } from './finding-status'

/**
 * Un hallazgo tal como lo ve el tablero. Lleva los DOS ejes porque son
 * ortogonales y el operador necesita ver los dos: `status` es su decision sobre
 * si cuenta, `lifecycle` es que le pasa al problema en el codigo.
 */
export interface Finding {
  readonly id: string
  readonly severity: Severity
  readonly title: string
  readonly file: string
  readonly line: number | null
  /** Descartado por el operador o abierto. Solo lo abierto bloquea un push. */
  readonly status: FindingStatus
  /** Que le pasa al PROBLEMA. Ortogonal a `status`: uno es la decision del
   *  operador sobre si cuenta, el otro si sigue ahi. */
  readonly lifecycle: FindingLifecycle
  /** Lo que el operador escribio al marcarlo arreglado, o null. */
  readonly mitigatedNote: string | null
  /** Lo que el ANALISTA dictamino en la ultima re-verificacion, o null. Aparte
   *  de la anterior porque son dos afirmaciones de dos autores, y porque esta
   *  sobrevive cuando el hallazgo vuelve a la cola (ADR-087). */
  readonly verificacionNote: string | null
  /** Ultimo escaneo que lo nombro. Comparado con el ultimo del proyecto dice si
   *  sigue RECONFIRMADO — que no cambia su estado: vivo esta igual. */
  readonly lastSeen: string
}
