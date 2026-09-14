import type { DesenlaceDeVerificacion } from './dictamen-de-verificacion'
import type { MotivoDeOmision } from './motivo-de-omision'
import type { RepartoDeVerificacion } from './verificacion-masiva'

/**
 * A que casilla va cada desenlace. Es una TABLA exhaustiva y no una cadena de
 * `if` con un `else` al final, por lo mismo que `casillaDeBaja` en el drenaje:
 * el cajon de sastre acababa tragandose desenlaces que nadie habia previsto y
 * anunciando como una cosa lo que era otra.
 *
 * Que sea un `Record` sobre el vocabulario cerrado es la mitad del trabajo: si
 * manana aparece un cuarto desenlace, esto no compila hasta que alguien decida
 * donde va. La otra mitad es el centinela de abajo, para el valor que llegue de
 * fuera del vocabulario sin pasar por el compilador.
 */
const CASILLA: Record<DesenlaceDeVerificacion, keyof RepartoDeVerificacion> = {
  extinguido: 'extinguidos',
  sin_prueba: 'sinPrueba',
  sigue_vivo: 'siguenVivos'
}

/**
 * La casilla de un desenlace. Fuera del vocabulario NO se adivina: cae a
 * `sinClasificar`, que es la casilla que se anuncia en el parte.
 *
 * El centinela no es ninguna de las tres reales, y menos `extinguidos`: esa
 * afirma que un analista probo la ausencia, y esa es justo la afirmacion que no
 * se puede hacer sobre un desenlace que no se entiende.
 */
export function casillaDelDesenlace(desenlace: string): keyof RepartoDeVerificacion {
  return CASILLA[desenlace as DesenlaceDeVerificacion] ?? 'sinClasificar'
}

/** La otra tabla, y por la misma razon: dos motivos, dos casillas, y un tercero
 *  no compilaria hasta que alguien dijera donde va. */
const CASILLA_DE_OMISION: Record<MotivoDeOmision, keyof RepartoDeVerificacion> = {
  'no-mitigado': 'noMitigados',
  'ya-trabajado': 'yaTrabajados'
}

const sumar = (
  reparto: RepartoDeVerificacion,
  casilla: keyof RepartoDeVerificacion
): RepartoDeVerificacion => ({ ...reparto, [casilla]: reparto[casilla] + 1 })

/** Suma un hallazgo VERIFICADO: un analista lo miro y dictamino. */
export function sumarDesenlace(
  reparto: RepartoDeVerificacion,
  desenlace: string
): RepartoDeVerificacion {
  return sumar(reparto, casillaDelDesenlace(desenlace))
}

/**
 * Suma uno que NO se verifico. Funcion aparte de la anterior y no un `null` en
 * su argumento: son dos hechos distintos —«lo miraron y dijo esto» contra «no
 * habia nada que mirar»— y el tipo lo dice antes que el comentario.
 */
export function sumarOmision(
  reparto: RepartoDeVerificacion,
  motivo: MotivoDeOmision
): RepartoDeVerificacion {
  return sumar(reparto, CASILLA_DE_OMISION[motivo])
}
