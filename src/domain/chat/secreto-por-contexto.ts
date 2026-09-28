import type { Regla } from './reglas-de-secreto'

/**
 * La credencial que viaja SIN su nombre al lado: la delata el SITIO donde esta.
 *
 * Existe porque el comodin del hash las tapaba SIN DECIRLO. Medido el 2026-09-28:
 * al acotar aquel, estas formas quedaban al descubierto en cuanto el valor no
 * fuera una tirada de 32 hexadecimales — y una contrasena rara vez lo es. Eran
 * tres agujeros que el arreglo del comodin habria abierto sin que nadie lo viera.
 *
 * Cada una conserva lo que hace LEGIBLE la linea y no dice nada secreto: el
 * usuario, la arroba, el nombre de la bandera. No se puede auditar lo que no se
 * ve, y una orden tachada entera se lee como si no hubiera pasado nada.
 */

/** La credencial dentro de una URL. El usuario admite estar VACIO: `redis://:clave@`. */
const EN_URL: Regla = [
  /([a-z][a-z0-9+.-]{1,15}:\/\/[^\s:@/]{0,64}:)[^\s@/]{1,256}(@)/gi,
  '$1***$2'
]

/** `-u usuario:clave`, la forma de `curl`. Se conserva el usuario. */
const BANDERA_U: Regla = [/(-u\s{0,4}[^\s:]{1,64}:)[^\s]{1,256}/g, '$1***']

/** Las banderas LARGAS que nombran lo que llevan. */
const BANDERA_LARGA: Regla = [
  /(--(?:password|token|secret|api-?key)[=\s])[^\s]{1,256}/gi,
  '$1***'
]

/**
 * El encabezado de autorizacion, con el valor hasta FIN DE LINEA y no hasta el
 * primer espacio: su valor lleva uno dentro (`Bearer xxx`), y quedarse con la
 * primera palabra tacha el `Bearer` y deja el token detras, al descubierto
 * (medido al intentar meterlo entre las palabras del nombre).
 */
const ENCABEZADO: Regla = [/authorization\s*:\s*[^\n]+/gi, '***']

/**
 * FUERA a proposito: `-p` PEGADO al valor, la forma de `mysql`. Medido sobre doce
 * ordenes reales del agente auditor, destrozaba SEIS: `find -print`, `-path`,
 * `-prune`, `-perm`, `rsync --progress` y `npm --prod`. La diferencia entre un
 * puerto y una clave es solo el espacio, y con esas seis en juego el cambio no
 * vale. Queda como hueco conocido: `mysql -pclave` no se tacha.
 */
export const REGLAS_POR_CONTEXTO: readonly Regla[] = [
  EN_URL,
  BANDERA_U,
  BANDERA_LARGA,
  ENCABEZADO
]
