import type { DesenlaceDeVerificacion } from './dictamen-de-verificacion'
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

/**
 * Suma un mitigado atendido al reparto. `null` es el que no habia que verificar
 * —una propuesta viva ya lo trabaja— y tiene casilla propia: contarlo como
 * verificado diria que un analista lo miro, y no lo miro nadie.
 */
export function sumarDesenlace(
  reparto: RepartoDeVerificacion,
  desenlace: string | null
): RepartoDeVerificacion {
  const casilla = desenlace === null ? 'omitidos' : casillaDelDesenlace(desenlace)
  return { ...reparto, [casilla]: reparto[casilla] + 1 }
}
