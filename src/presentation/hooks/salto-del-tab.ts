/**
 * A donde salta el foco cuando se pulsa Tab dentro de un dialogo modal.
 *
 * Pura a proposito: el repo prueba en `node`, sin DOM, y la parte que se puede
 * equivocar es esta aritmetica —no el `focus()` que la ejecuta—. `useFocoDelDialogo`
 * le pasa los numeros y hace lo que diga.
 *
 *   total   cuantos elementos enfocables tiene el dialogo
 *   activo  el indice del que tiene el foco, o -1 si el foco esta en la caja del
 *           dialogo o fuera de ella
 *   atras   Shift+Tab
 *
 * Devuelve el indice al que hay que llevar el foco, o `null` cuando el navegador
 * ya hace lo correcto solo. Intervenir de mas romperia el orden natural entre
 * dos controles de en medio, que es justo el que el lector de pantalla espera.
 */
export function saltoDelTab(total: number, activo: number, atras: boolean): number | null {
  if (total <= 0) return null
  if (activo < 0) return atras ? total - 1 : 0
  if (atras && activo === 0) return total - 1
  if (!atras && activo === total - 1) return 0
  return null
}
