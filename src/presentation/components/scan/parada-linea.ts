import type { ParadaEnCurso } from '@domain/scan/scan-chunk'

/**
 * La linea que dice por donde va el recorrido: «Parada 4 de 12 · apps/api».
 *
 * Vive fuera del `<pre>` del progreso a proposito. Ese cuadro tiene altura fija
 * y scroll, y persigue el final del texto del agente: un contador metido ahi se
 * pierde en el muro y deja de ser un contador. Este va fijo, se lee sin
 * desplazar nada, y es lo unico que el operador necesita mirar para saber si el
 * escaneo avanza.
 */
export function lineaDeParada(parada: ParadaEnCurso): string {
  return `Parada ${parada.hecha} de ${parada.total} · ${parada.carpeta}`
}

/**
 * Solo se ensena si ESTE proyecto esta escaneando y ya cerro una parada. Un
 * escaneo de una pieza nunca reporta ninguna, y ahi no hay recorrido que contar.
 */
export function hayParadaQueEnsenar(
  running: boolean,
  parada: ParadaEnCurso | null
): parada is ParadaEnCurso {
  return running && parada !== null
}
