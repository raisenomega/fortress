/**
 * La escalera de modelos (ADR-088, Enmienda 2): la UNICA fuente del nivel con el
 * que produce el Terminal. De mas alto a mas bajo, y en ALIAS, no en ids fijos
 * (el molde de ADR-078): cada peldano apunta siempre al ultimo modelo de su
 * familia, asi que sube de version sin tocar este fichero.
 */
export const ESCALERA = ['fable', 'opus', 'sonnet', 'haiku'] as const

export type Peldano = (typeof ESCALERA)[number]

/**
 * La cima de la escalera: SOLO ancla al productor (ADR-088 Enm. 3 §2). No es el
 * modelo de nadie: con 'fable' el productor queda en 'opus'. Fable no lo usa
 * ningun agente (Covered Model, 30 dias de retencion — Enm. 3 §1).
 *
 * CORREGIDO 2026-10-05: aqui se afirmaba «nada corre con Fable». Era falso: los
 * cuatro del Motor no declaraban modelo, heredaban el del CLI y corrieron en
 * Fable. Desde la enmienda a ADR-078 todos declaran (`modelo-por-rol.ts`).
 */
export const CIMA: Peldano = 'fable'

/** El modelo de OMEGA (ADR-088 Enm. 3 §2): el peldano mas alto que la cuenta
 *  permite bajo la doctrina de retencion. NO se deriva de CIMA: subir a OMEGA
 *  no debe arrastrar al productor. Decidido el 15-sep, construido el 05-oct. */
export const MODELO_DE_OMEGA: Peldano = 'opus'

/** El peldano de justo debajo. La base no tiene debajo y se queda en si misma:
 *  por eso la cima nunca puede ser la base (lo fija su test). */
export function peldanoDeDebajo(peldano: Peldano): Peldano {
  const indice = ESCALERA.indexOf(peldano)
  return ESCALERA[Math.min(indice + 1, ESCALERA.length - 1)]
}

/** El modelo del productor del Terminal: NO se nombra, se DERIVA de la cima.
 *  Cuando la cima sube, el productor sube con ella sin tocar nada mas. */
export const MODELO_DEL_PRODUCTOR: Peldano = peldanoDeDebajo(CIMA)
