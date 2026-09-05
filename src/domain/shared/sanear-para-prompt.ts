/** Lo que cabe de un texto ajeno en una linea de prompt sin sepultarla. */
const MAX_LEN = 200

/**
 * Texto que NO escribimos nosotros, aplanado antes de entrar en el prompt de un
 * agente. Es un control de SEGURIDAD, no de estetica: sin el, un salto de linea
 * en el titulo de un hallazgo o en la nota de otro agente empieza una linea
 * nueva dentro del prompt, y una linea nueva puede parecer una instruccion.
 *
 * Aplana `\r\n\t`, colapsa los espacios y acota con `…` para que se vea que hubo
 * corte. No censura nada: el texto sobrevive entero como TEXTO, pegado a su
 * linea, que es justo lo que le quita el poder de mandar.
 *
 * Vivia COPIADO en `knownFindings` y en `loYaAtendido`, identico en los dos, y
 * al necesitarse un tercero para el titulo del hallazgo la copia dejaba de ser
 * casualidad: un control de seguridad repetido se desfasa: se arregla en un
 * sitio, sigue roto en los otros dos, y nadie se entera porque los tres
 * "tienen saneado".
 */
export function sanearParaPrompt(texto: string, maxLen: number = MAX_LEN): string {
  const plano = texto
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return plano.length > maxLen ? `${plano.slice(0, maxLen)}…` : plano
}
