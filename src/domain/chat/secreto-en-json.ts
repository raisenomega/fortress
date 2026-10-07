import type { Regla } from './reglas-de-secreto'

/**
 * El secreto generico en sintaxis JSON: `{"apiKey":"v"}` pasaba ENTERO porque
 * la comilla de cierre de la clave rompe el `[=:]` de las reglas por nombre
 * (medido, PASO 72; 0 exposicion en la base — latente, no activa).
 *
 * El valor se acota con la COMILLA de cierre, nunca `\S+`: lo que la regla
 * muerda queda dentro del string y el JSON sigue valido — ni la corrupcion del
 * PASO 69 ni el guard del 70 saltando. Se conserva la clave: se audita QUE
 * habia, no que valia.
 *
 * SIN la bandera `i` a proposito: la caja es la frontera de `Key`/`Pwd`
 * (la joroba camel), igual que en `secreto-por-nombre`. `monkey` y `keyword`
 * van en minuscula plana y no casan; `MONKEY` entero en mayusculas si — el
 * mismo coste aceptado que `MONKEY=` (2026-09-28): tachar de mas es cosmetico,
 * no tachar es una credencial en disco.
 */
const caja = (w: string): string => `${w}|${w[0].toUpperCase()}${w.slice(1)}|${w.toUpperCase()}`
const LARGAS = ['password', 'passwd', 'secret', 'token', 'credential', 'credentials', 'apikey']
  .map(caja)
  .join('|')

/** Claves LEGITIMAS que la joroba pescaria: se miden sobre el corpus real y se
 *  eximen ENTERAS (la clave exacta), nunca por trozo. */
export const CLAVES_LEGITIMAS: readonly string[] = []

const CUERPO = [
  `[\\w.-]*(?:${LARGAS})[\\w.-]*`, // la palabra larga, en cualquier sitio
  `[\\w.-]*[a-z0-9](?:Key|Pwd)[\\w.-]*`, // la joroba camel: encryptionKey, dbPwd
  `[\\w.-]*[._-](?:key|pwd|KEY|PWD)[\\w.-]*`, // tras separador: api_key, API_KEY
  `(?:key|pwd|KEY|PWD)` // la clave exacta y pelada
].join('|')

const veto = (): string =>
  CLAVES_LEGITIMAS.length === 0 ? '' : `(?!(?:${CLAVES_LEGITIMAS.join('|')})")`

/** `("clave":")valor(")` — el valor admite escapes y termina en SU comilla. */
const NORMAL = (): RegExp =>
  new RegExp(`("${veto()}(?:${CUERPO})"\\s*:\\s*")((?:[^"\\\\]|\\\\.)+)(")`, 'g')

/** La variante ANIDADA: el mismo par pero con las comillas escapadas (\\"),
 *  como viaja un JSON dentro de un string de otro JSON. */
const ANIDADA = (): RegExp =>
  new RegExp(`(\\\\"${veto()}(?:${CUERPO})\\\\"\\s*:\\s*\\\\")((?:\\\\[^"]|[^"\\\\])+)(\\\\")`, 'g')

export const REGLAS_EN_JSON: readonly Regla[] = [
  [ANIDADA(), '$1***$3'],
  [NORMAL(), '$1***$3']
]
