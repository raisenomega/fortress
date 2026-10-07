/**
 * El corte del bloque NOTAS para el texto EN VIVO. El bloque no llega al
 * operador (sub-pieza 3 del #5) y eso vale tambien para el borrador que
 * streamea: se corta en cuanto el marcador ASOMA, aunque el bloque venga a
 * medias — un bloque entero lo quita `sinBloqueDeNotas`, pero el borrador no
 * puede esperar al cierre.
 *
 * El marcador es el mismo con el que abre `BLOQUE` en `extraer-notas.ts`; el
 * test de COHERENCIA de al lado los ata: si uno cambia sin el otro, rojo.
 */
const MARCADOR = 'NOTAS:'

export function antesDeNotas(texto: string): string {
  const corte = texto.indexOf(MARCADOR)
  return corte === -1 ? texto : texto.slice(0, corte)
}
