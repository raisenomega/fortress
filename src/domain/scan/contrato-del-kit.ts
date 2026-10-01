import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

/**
 * Si el kit de referencia esta a mano, y por que no (ADR-108 §5).
 *
 * `internal/AUDIT-KIT/` es la copia de referencia de las plantillas del
 * operador, y vive en `.gitignore` A PROPOSITO: son el producto, no codigo. Por
 * eso NO viaja a un worktree, y el gate del Motor corre en worktree.
 *
 * LA LINEA QUE IMPORTA, y es la que separa esto de un gate que miente: el
 * contrato de las doce plantillas FALLA si el kit esta y alguna no encaja, y se
 * SALTA DICIENDOLO si el kit no esta. **Nunca pasa en silencio por ausencia.**
 * Un `it` que se tragara la ausencia y saliera verde dejaria pasar un fix que
 * rompiera el extractor —y el extractor, al romperse, devuelve `null`: silencio
 * sin bloque, justo lo que nadie ve—.
 *
 * En el worktree no es que el contrato mienta: es que ahi NO HAY documentos que
 * medir. Saltarlo es decir la verdad; correrlo seria inventarla.
 */
export const RUTA_DEL_KIT = join(process.cwd(), 'internal', 'AUDIT-KIT')

/** La razon del salto, para que se LEA en la salida y no sea un hueco mudo. */
export const RAZON_SIN_KIT =
  'kit ausente (internal/AUDIT-KIT no viaja a un worktree): no hay plantillas que medir aqui'

/** true si hay kit que medir. Lo mas barato que distingue las dos situaciones. */
export function kitDisponible(ruta: string = RUTA_DEL_KIT): boolean {
  if (!existsSync(ruta)) return false
  try {
    return readdirSync(ruta).some((n) => n.startsWith('PLANTILLA_MODULO_M'))
  } catch {
    return false
  }
}
