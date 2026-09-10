import type { CoberturaDeclarada } from '@application/scan/scan-types'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import type { NoticeTone } from '../common/Notice'

/** Por que se corto, dicho para quien no lee vocabularios cerrados. */
const PORQUE: Record<MotivoCierre, string> = {
  completo: 'recorrido completo',
  abortado: 'lo detuviste',
  fallo: 'el escaner fallo',
  timeout: 'se agoto el tiempo',
  presupuesto: 'se agoto el presupuesto'
}

/**
 * La cuenta que convierte «escanee» en «escanee, y aqui esta la cuenta».
 *
 * Sin manifiesto no hay cobertura que declarar —un escaneo de una pieza no
 * cuenta ficheros— y entonces esta linea calla en vez de inventar un total.
 */
export function lineaDeCobertura(cobertura: CoberturaDeclarada): string | null {
  const { ficherosCubiertos, ficherosTotal } = cobertura
  if (ficherosCubiertos === null || ficherosTotal === null) return null

  const cuenta = `Audito ${ficherosCubiertos} de ${ficherosTotal} ficheros`
  const paradas = `${cobertura.paradasHechas} de ${cobertura.paradasTotal} paradas`
  return cobertura.estado === 'CERRADO'
    ? `${cuenta} · ${paradas}`
    : `${cuenta} · ${paradas} · ${PORQUE[cobertura.motivoCierre]}`
}

/**
 * `ok` solo cuando se miro TODO lo prometido. Un recorrido cortado no es un
 * error —lo guardado vale— pero tampoco un exito, y pintarlo verde afirmaria
 * que se reviso lo que nadie reviso. Para eso existe el tono neutro.
 */
export function tonoDeCobertura(cobertura: CoberturaDeclarada): NoticeTone {
  return cobertura.estado === 'CERRADO' ? 'ok' : 'aviso'
}
