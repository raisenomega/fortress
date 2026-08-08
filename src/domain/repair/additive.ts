/**
 * Un fix es ADITIVO cuando AGREGA un control que falta (una guarda, una
 * validacion, un registro) y deja la logica existente donde esta. Es la senal
 * mas fuerte de superficie contenida: el codigo actual no se reescribe, el fix
 * cuelga de el.
 *
 * La heuristica lee el TITULO del hallazgo, que es como el escaner describe la
 * ausencia. Dos formas de decir lo mismo:
 *   - ausencia nombrada:  "sin guardRun", "falta un control", "no pasa por X"
 *   - control no ejercido: "no valida", "no verifica", "no resuelve"
 */

/**
 * El control existe en el repo pero esta linea no lo ejerce.
 * `(?:se\s+)?` cubre la pasiva refleja: "no se valida la IP".
 */
const CONTROL_NO_EJERCIDO =
  /\bno\s+(?:se\s+)?(?:usa|llama|trackea|registra|guarda|valida|verifica|comprueba|chequea|resuelve|sanitiza|escapa|limita|filtra|restringe|pasa por)\b/i

/** El control directamente no esta: se nombra su ausencia. */
const AUSENCIA_DE_CONTROL = /\b(?:sin|falta|faltan|carece|omite)\b|\bno\s+(?:hay|existe)\b/i

/**
 * true si el fix es ADITIVO (agregar un control faltante), no reescribir logica.
 *
 * Ojo con el falso NEGATIVO, que es el caro: clasificar como reescritura un fix
 * que solo agregaba una guarda infla su superficie y el selector lo descarta
 * para siempre. Paso con el SSRF ("no valida la IP resuelta por DNS") y con el
 * loop autonomo ("no verifica trusted"): ambos ADITIVOS puntuados 11.
 */
export function isAdditive(title: string): boolean {
  return AUSENCIA_DE_CONTROL.test(title) || CONTROL_NO_EJERCIDO.test(title)
}
