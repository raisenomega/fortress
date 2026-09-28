/** Lo que cabe de un texto ajeno en una linea de prompt sin sepultarla. */
const MAX_LEN = 200

/**
 * TODO lo que puede romper una linea o esconderse dentro de ella, en una sola
 * clase: controles C0 y C1 (`Cc`, ahi entran `\r\n\t`, VT, FF, NEL y el byte
 * nulo), formato invisible (`Cf`: el espacio de ancho cero, los cuatro controles
 * de direccion y el BOM), separador de LINEA (`Zl`: U+2028), de PARRAFO (`Zp`:
 * U+2029) y de espacio (`Zs`: el espacio normal, NBSP, U+3000 y compania).
 *
 * Reemplaza a las dos sustituciones que habia, y las dos tenian un hueco MEDIDO
 * el 2026-09-27: la primera solo miraba `\r\n\t`, y la segunda exigia DOS
 * blancos seguidos, asi que un U+2028 SOLO pasaba entero. De 22 caracteres
 * probados sobrevivian 19. Con la clase sobreviven 0, y los 13 textos normales
 * de la medicion salen identicos: el control aplana, no censura.
 *
 * Colapsa la RACHA (`+`) y no el caracter suelto, que es lo que hace que ya no
 * dependa de cuantos vengan seguidos.
 */
const APLANABLES = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Zs}]+/gu

/**
 * El control de SEGURIDAD solo, sin tope de longitud.
 *
 * Existe aparte porque el tope es otra cosa: aquel evita que un texto ajeno
 * sepulte la linea, y este evita que ABRA una. Quien sanea un campo de analisis
 * necesita el primero sin el segundo — medido: `analysis_reason` llega a 1526
 * caracteres en la base viva, y acotarlo a 200 mutilaria el analisis.
 */
export function aplanarParaPrompt(texto: string): string {
  return texto.replace(APLANABLES, ' ').trim()
}

/**
 * Texto que NO escribimos nosotros, aplanado antes de entrar en el prompt de un
 * agente. Es un control de SEGURIDAD, no de estetica: sin el, un salto de linea
 * en el titulo de un hallazgo o en la nota de otro agente empieza una linea
 * nueva dentro del prompt, y una linea nueva puede parecer una instruccion.
 *
 * Aplana, colapsa los espacios y acota con `…` para que se vea que hubo corte.
 * No censura nada: el texto sobrevive entero como TEXTO, pegado a su linea, que
 * es justo lo que le quita el poder de mandar.
 *
 * Vivia COPIADO en `knownFindings` y en `loYaAtendido`, identico en los dos, y
 * al necesitarse un tercero para el titulo del hallazgo la copia dejaba de ser
 * casualidad: un control de seguridad repetido se desfasa: se arregla en un
 * sitio, sigue roto en los otros dos, y nadie se entera porque los tres
 * "tienen saneado".
 */
export function sanearParaPrompt(texto: string, maxLen: number = MAX_LEN): string {
  const plano = aplanarParaPrompt(texto)
  return plano.length > maxLen ? `${plano.slice(0, maxLen)}…` : plano
}
