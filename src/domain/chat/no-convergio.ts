import { sanearParaPrompt } from '../shared/sanear-para-prompt'

/**
 * El tercer desenlace del ciclo (ADR-090, amplia ADR-088 pieza 3): el turno
 * autonomo lo intento, OMEGA lo veto, el reintento dejo de avanzar y el arbol
 * volvio a como estaba.
 *
 * Lo que NO puede pasar es que eso sea silencio. Sin esto, un hallazgo que no
 * convergio quedaba indistinguible de uno que nadie toco: la fila igual, el
 * hilo igual, y el lote siguiendo como si nada. Se cuenta en los DOS sitios
 * donde el operador va a mirar —la fila del hallazgo y el hilo del Terminal—
 * con la objecion literal de OMEGA, que es lo unico que dice por que no salio.
 *
 * El lote SIGUE. Un hallazgo que no converge es informacion sobre ESE hallazgo,
 * no sobre los N que quedan, y parar el lote entero convertiria un dato local en
 * un bloqueo global. Nunca se llama al humano: en autonomo no hay a quien.
 */
export function notaDeNoConvergio(razon: string, intentos: number): string {
  return (
    `no resuelto — no convergio: el Terminal lo intento ${intentos} ${veces(intentos)} y ` +
    `el revisor lo veto. Ultima objecion: ${sanearParaPrompt(razon)}`
  )
}

/** El parte del turno. Dice tambien que el arbol quedo intacto: sin eso, el
 *  operador no sabe si tiene medio fix a medias que revisar. */
export function parteDeNoConvergio(razon: string, intentos: number): string {
  return [
    `Cierre del ciclo (ADR-090): NO se resolvio. Tras ${intentos} ${veces(intentos)}, el`,
    'revisor siguio vetando y el ultimo intento dejo de avanzar, asi que se corto.',
    'Tu codigo quedo como estaba —cada intento se deshizo— y el hallazgo sigue',
    `activo en Escaneo con la razon. Ultima objecion del revisor: ${sanearParaPrompt(razon)}`
  ].join(' ')
}

const veces = (n: number): string => (n === 1 ? 'vez' : 'veces')
