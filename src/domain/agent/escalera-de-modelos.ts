/**
 * La escalera de modelos (ADR-088, Enmienda 2): la UNICA fuente del nivel con el
 * que produce el Terminal. De mas alto a mas bajo, y en ALIAS, no en ids fijos
 * (el molde de ADR-078): cada peldano apunta siempre al ultimo modelo de su
 * familia, asi que sube de version sin tocar este fichero.
 */
export const ESCALERA = ['fable', 'opus', 'sonnet', 'haiku'] as const

export type Peldano = (typeof ESCALERA)[number]

/**
 * La cima de la red: donde ira OMEGA, siempre por encima del que produce
 * (Enmienda 1 §1).
 *
 * PENDIENTE ADR-078: valor real con la pieza 5, cuando se resuelva la deuda
 * `omega-fable-choca-con-adr-078`. Hoy NO se aplica a OMEGA —sigue con el
 * modelo de su catalogo— y nada corre con Fable: solo fija el peldano del
 * productor. El default 'fable' deja al productor en 'opus'; con 'opus' caeria
 * a 'sonnet', una bajada que no se quiere mientras se decide Fable.
 */
export const CIMA: Peldano = 'fable'

/** El peldano de justo debajo. La base no tiene debajo y se queda en si misma:
 *  por eso la cima nunca puede ser la base (lo fija su test). */
export function peldanoDeDebajo(peldano: Peldano): Peldano {
  const indice = ESCALERA.indexOf(peldano)
  return ESCALERA[Math.min(indice + 1, ESCALERA.length - 1)]
}

/** El modelo del productor del Terminal: NO se nombra, se DERIVA de la cima.
 *  Cuando la cima sube, el productor sube con ella sin tocar nada mas. */
export const MODELO_DEL_PRODUCTOR: Peldano = peldanoDeDebajo(CIMA)
