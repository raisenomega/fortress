/** El bloque PASO que el CTO envuelve en su salida. Molde `extraer-notas`:
 *  delimitador explicito, no-greedy, sin `g` → la PRIMERA aparicion. Un `]`
 *  suelto dentro del PASO no cierra: el terminador es `]:END-PASO` entero. */
const BLOQUE = /PASO:\s*\[([\s\S]*?)\]:END-PASO/

/**
 * El contenido del bloque PASO de una respuesta del CTO, o `null` si no lo hay.
 *
 * Fail-safe por diseno del lazo autonomo: `null` cuando el CTO NO emite un PASO
 * —conversa, pregunta, concluye o se queda a medias— y el salto no debe
 * dispararse. Con varios bloques devuelve el PRIMERO (`exec` sin `g`): el CTO
 * emite uno por turno y un segundo, si lo hubiera, es ruido. Un bloque vacio
 * tambien es `null`: no hay nada que ejecutar.
 */
export function extraerPaso(texto: string): string | null {
  const match = BLOQUE.exec(texto)
  if (match === null) return null
  const contenido = match[1].trim()
  return contenido === '' ? null : contenido
}
