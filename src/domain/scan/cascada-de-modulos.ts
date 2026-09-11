import type { Contexto, Destino } from './destino-de-modulo'

export type { Caja, Contexto, Destino } from './destino-de-modulo'
import { MODULOS_SIEMPRE } from './modulos-siempre'
// prettier-ignore
import { razonDeclaradoNo, razonJuicioSinEvidencia, razonJuzgadoNo, razonNoSeDecide, razonSinSenal } from './razon-de-modulo'
import { MODULOS_CON_SENAL } from './senales-derivadas'
import { esUsable, MODULOS_A_JUICIO } from './veredicto-de-aplicabilidad'

const APLICA: Destino = { caja: 'aplicables', razon: '' }

/** Quien declara sabe mejor, y por eso es el primer peldano: en los dos
 *  sentidos, y por delante de cualquier senal que pudiera desdecirle. */
const porDeclaracion = ({ modulo, declarado }: Contexto): Destino | null => {
  if (declarado === true) return APLICA
  if (declarado === false) return { caja: 'descartados', razon: razonDeclaradoNo(modulo) }
  return null
}

/** Nucleo: no hay nada que preguntar ni nada que gastar. */
const porSiempre = ({ modulo }: Contexto): Destino | null =>
  MODULOS_SIEMPRE.includes(modulo) ? APLICA : null

/** Una senal de fichero o de dependencia. Gratis y determinista. */
const porSenal = ({ detectado }: Contexto): Destino | null => (detectado ? APLICA : null)

/** El unico peldano que costo un spawn, y solo vale si trajo la prueba. */
const porJuicio = ({ modulo, veredicto }: Contexto): Destino | null => {
  if (veredicto === undefined || !esUsable(veredicto)) return null
  return veredicto.aplica === 'si'
    ? APLICA
    : { caja: 'descartados', razon: razonJuzgadoNo(modulo, veredicto.porque) }
}

/**
 * Sin resolver. Los de juicio caen a «no consta» —su ausencia de senal no
 * prueba nada— y el resto a descartado, que ahi si es concluyente.
 */
function sinResolver({ modulo, veredicto }: Contexto): Destino {
  if (MODULOS_A_JUICIO.includes(modulo)) {
    const razon = veredicto === undefined ? razonNoSeDecide : razonJuicioSinEvidencia
    return { caja: 'sinConstancia', razon: razon(modulo) }
  }
  if (MODULOS_CON_SENAL.includes(modulo)) {
    return { caja: 'descartados', razon: razonSinSenal(modulo) }
  }
  return { caja: 'sinConstancia', razon: razonNoSeDecide(modulo) }
}

/**
 * La cascada de ADR-083, del peldano mas barato al mas caro: declaracion ->
 * siempre -> senal -> juicio -> sin resolver. El ORDEN es la doctrina, no una
 * optimizacion: cada peldano que resuelve ahorra el siguiente, y el unico que
 * gasta un proceso es el cuarto.
 */
export const decidir = (contexto: Contexto): Destino =>
  porDeclaracion(contexto) ??
  porSiempre(contexto) ??
  porSenal(contexto) ??
  porJuicio(contexto) ??
  sinResolver(contexto)
