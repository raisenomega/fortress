import type { Regla } from './reglas-de-secreto'

/**
 * Por el NOMBRE de lo que se asigna, partido en DOS clases segun la palabra.
 *
 * Todo esto sale de una medicion del 2026-09-28: de 21 secretos reales probados,
 * 13 se escapaban, y no por casos raros sino por la forma mas comun de todas —el
 * prefijo PEGADO a la palabra, `PGPASSWORD` y no `PG_PASSWORD`—. La causa era una
 * sola condicion: la palabra no podia venir precedida de una LETRA.
 *
 * Esa condicion existia por una razon buena y sigue haciendo falta, pero solo
 * para las palabras CORTAS. `key` es sufijo de `monkey`, `donkey`, `turkey`,
 * `turnkey`, `lowkey`, `hockey`, `whiskey` y `jockey`, y sin la condicion se
 * tachaban todas: acotar de mas destroza texto legitimo, y un comando tachado
 * entero no se puede leer ni auditar.
 *
 * Las palabras LARGAS no colisionan con nada, asi que no la necesitan. Medido:
 * `secretaria=`, `secreto=`, `tokenizer=`, `passwordless=` y `tokens=100` quedan
 * intactos, porque la regla exige el `=` o el `:` PEGADO a la palabra. El unico
 * falso positivo que queda es `betoken=`, palabra arcaica inglesa, y su coste es
 * cosmetico frente a lo que se gana: `mypassword=`, `dbPassword=` y `authToken=`
 * ya no se escapan.
 *
 * `authorization` NO entra aqui aunque lo parezca: su valor lleva un espacio
 * (`Bearer xxx`), y un `\S+` se queda con la primera palabra y deja el token
 * detras, al descubierto. Lo caza su propia regla, con el valor hasta fin de
 * linea. Medido: al meterlo aqui, `Authorization: Bearer tok` salia `*** tok`.
 */
const LARGAS: Regla = [
  /(?:password|passwd|token|secret|credentials?)\s*[=:]\s*\S+/gi,
  '***'
]

/** Las CORTAS conservan la condicion de la letra: son las que colisionan. */
const CORTAS: Regla = [/(?<![A-Za-z])(?:api[_-]?key|key|pwd)\s*[=:]\s*\S+/gi, '***']

/**
 * Y las dos formas en que una palabra corta llega PEGADA sin ser un sufijo de
 * diccionario, porque la CAJA marca la frontera que la letra no ve.
 *
 * Lo que las hace seguras NO es el prefijo sino la palabra en MAYUSCULAS: en
 * `monkey` y en `myMonkey` el `key` va en minuscula, y la regla no lleva la marca
 * de ignorar la caja. Por eso el prefijo admite las dos cajas — exigirlo en
 * mayusculas dejaba escapar `myKEY=`, `dbKEY=` y `myPWD=`, y no protegia nada
 * mas: lo delato un mutante que sobrevivio dos veces.
 *
 * COSTE ACEPTADO Y MEDIDO: una palabra del diccionario escrita ENTERA en
 * mayusculas y seguida de `=` se tacha — `MONKEY=banana`, `TURKEY=pavo`. No hay
 * forma de distinguirla de `MYKEY=`, porque tienen la misma forma. Se elige este
 * lado a proposito: tachar una palabra de mas cuesta legibilidad en una linea que
 * casi nunca existe; no tacharla cuesta una credencial escrita en disco.
 */
const CORTAS_PEGADAS: readonly Regla[] = [
  [/(?<![A-Za-z])[A-Za-z][A-Za-z0-9]*(?:APIKEY|KEY|PWD)\s*[=:]\s*\S+/g, '***'],
  [/(?<=[a-z])(?:Api[_-]?Key|Key|Pwd)\s*[=:]\s*\S+/g, '***']
]

export const REGLAS_POR_NOMBRE: readonly Regla[] = [LARGAS, CORTAS, ...CORTAS_PEGADAS]
