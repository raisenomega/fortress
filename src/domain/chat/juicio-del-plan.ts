/**
 * El vocabulario del juicio del PLAN (ADR-097 §2). NO es el del fix.
 *
 * Los cinco ejes del fix miden un HECHO: hay un diff, se lee, y se dice si
 * resuelve. Aqui no hay diff — hay una PROMESA— y por eso ni los ejes ni las
 * palabras se reusan. `calidad_del_diff` sobre un plan vacio daria un APROBADO
 * computado sobre nada, que es justo el verde-que-no-midio-nada que ADR-091
 * existe para impedir.
 *
 * LAS PALABRAS SON DISTINTAS A PROPOSITO. El fix dice APROBADO/VETADO; el plan
 * dice ADELANTE/REPLANTEA. No es estilo: es para que nadie lea un veredicto del
 * plan creyendo que leyo uno del fix. Si compartieran palabra, un `APROBADO` en
 * un log no diria cual de los dos filtros lo emitio — y son de dureza muy
 * distinta.
 */
export type SentidoDelPlan = 'SI' | 'NO' | 'NO_SE_PUEDE_SABER'
export type AlcanceDeclarado = 'AJUSTADO' | 'AMPLIO'
export type VeredictoDelPlan = 'ADELANTE' | 'REPLANTEA'

export interface EjesDelPlan {
  /** Si el plan dice atacar la CAUSA, o solo el sintoma que se ve. */
  readonly ataca_la_causa: SentidoDelPlan
  /** Si el plan ANUNCIA tocar lo que el analisis marco como intocable. */
  readonly declara_tocar_lo_intocable: 'SI' | 'NO'
  /** Si lo que declara cambiar cabe en el hallazgo, o abre un refactor. */
  readonly alcance: AlcanceDeclarado
}

export interface JuicioDelPlan extends EjesDelPlan {
  readonly veredicto: VeredictoDelPlan
  readonly razon: string
}

/**
 * El veredicto lo computa el CODIGO a partir de los ejes, nunca el modelo (D19,
 * la misma doctrina que `computeGlobalVerdict`).
 *
 * `NO_SE_PUEDE_SABER` NO deniega, y esa es la decision que hace honesto a este
 * filtro: un plan que no se puede evaluar desde su prosa no es un plan malo —
 * es uno que este cedazo no alcanza. Denegarlo seria fingir dureza que no
 * tiene. La red que si mira hechos es el juicio del FIX, y corre despues.
 *
 * `AMPLIO` tampoco deniega por si solo: un alcance grande puede estar
 * justificado, y decidirlo sin ver el codigo seria adivinar. Viaja al parte
 * para que el operador lo vea.
 */
export function computarVeredictoDelPlan(ejes: EjesDelPlan): VeredictoDelPlan {
  if (ejes.declara_tocar_lo_intocable === 'SI') return 'REPLANTEA'
  return ejes.ataca_la_causa === 'NO' ? 'REPLANTEA' : 'ADELANTE'
}

/** Si el plan puede seguir adelante sin que nadie mas lo mire. */
export const puedeSeguir = (v: VeredictoDelPlan): boolean => v === 'ADELANTE'
