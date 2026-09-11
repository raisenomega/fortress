import type { ModuloAuditoria } from './modulo-auditoria'
// prettier-ignore
import { POR_DEPENDENCIA, POR_EXTENSION, POR_FICHERO_RAIZ, POR_PATRON, type TablaDeSenales } from './senales-de-modulo'

const TODAS: TablaDeSenales = [
  ...POR_EXTENSION,
  ...POR_FICHERO_RAIZ,
  ...POR_PATRON,
  ...POR_DEPENDENCIA
]

/** Los modulos que ESTAS tablas saben decidir. Derivado, nunca escrito aparte. */
export const MODULOS_CON_SENAL: readonly ModuloAuditoria[] = [...new Set(TODAS.map(([, m]) => m))]

/** Las senales de un modulo, para que su descarte diga QUE se busco y no habia. */
export const senalesDe = (modulo: ModuloAuditoria): readonly string[] =>
  TODAS.filter(([, m]) => m === modulo).map(([senal]) => senal)
