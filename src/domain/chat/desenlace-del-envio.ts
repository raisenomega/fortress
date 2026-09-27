import type { VeredictoDelPlan } from './juicio-del-plan'
import type { Negativa } from './envio-negado'
import type { SinCierre } from './motivo-sin-cierre'

/**
 * Lo que la cola del lote necesita saber de un turno ya terminado, sin llevarse
 * nada del codigo del cliente: un enum y un booleano.
 *
 * `sinVerificar` viaja aparte de `sinCierre` porque son cosas distintas: aquel
 * dice por que NO se cerro el ciclo; este dice que si se conservo, pero que
 * nadie pudo compilar el proyecto (ADR-091). Un turno puede cerrar su ciclo
 * perfectamente y aun asi no haberse verificado nunca.
 */
export interface DesenlaceDelEnvio {
  readonly sinCierre: SinCierre | null
  readonly sinVerificar: boolean
  /**
   * Como juzgo OMEGA la DIRECCION del plan del lote, o `null` —que es lo normal:
   * solo un turno de plan en autonomo se juzga, y ahi `null` significa que no se
   * pudo juzgar (ADR-097 §2.2-bis). En supervisado siempre es `null`: alli
   * aprueba el operador con su Enter.
   *
   * Cruza el puente SOLO el enum, nunca la razon de OMEGA: la razon habla del
   * codigo del cliente, y esa es la misma linea que `sinCierre` respeta. Cuando
   * el bucle de replanteo la necesite (4b) la leera en el main, sin cruzarla.
   */
  readonly plan: VeredictoDelPlan | null
  /** Una puerta del main nego el envio ANTES de que el turno existiera. `null` es
   *  lo normal. No es un desenlace del hallazgo: es una condicion del LOTE. */
  readonly negado: Negativa | null
}

export const ENVIO_SIN_DATO: DesenlaceDelEnvio = { sinCierre: null, sinVerificar: false, plan: null, negado: null } // prettier-ignore
