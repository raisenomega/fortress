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
}

export const ENVIO_SIN_DATO: DesenlaceDelEnvio = { sinCierre: null, sinVerificar: false }
