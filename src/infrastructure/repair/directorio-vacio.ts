import { rmdirSync } from 'node:fs'

/** Borra un directorio solo si esta VACIO: el mejor esfuerzo nunca se lleva contenido.
 *  Con contenido, o inexistente, se queda como esta y no se dice nada. */
export function rmdirSiVacio(ruta: string): void {
  try {
    rmdirSync(ruta)
  } catch {
    /* con contenido o inexistente: se queda como esta */
  }
}
