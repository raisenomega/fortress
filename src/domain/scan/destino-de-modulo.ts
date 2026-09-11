import type { ModuloAuditoria } from './modulo-auditoria'
import type { VeredictoAplicabilidad } from './veredicto-de-aplicabilidad'

export type Caja = 'aplicables' | 'descartados' | 'sinConstancia'

/** En que caja cae un modulo, y con que razon si la caja la exige. */
export interface Destino {
  readonly caja: Caja
  readonly razon: string
}

/** Lo que se sabe de un modulo cuando le toca decidirse. */
export interface Contexto {
  readonly modulo: ModuloAuditoria
  readonly declarado: boolean | undefined
  readonly detectado: boolean
  readonly veredicto: VeredictoAplicabilidad | undefined
}
