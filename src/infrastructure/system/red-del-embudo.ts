import type { SelfNoteDraft } from '@domain/system/self-observation'

/** Las dos salidas de un fallo: la que VIAJA (la clase) y la que se queda (el
 *  error entero). Inyectadas para que los embudos se prueben sin Electron ni
 *  base. `projectId` solo lo trae el de IPC, y solo a veces: 35 de sus 110
 *  canales lo reciben, y los otros no revientan sobre proyecto ninguno. */
export interface SumideroDeFallos {
  readonly asentar: (nota: SelfNoteDraft, projectId?: string) => void
  readonly registrar: (que: string, error: unknown) => void
}

let dentro = false

/**
 * La red que comparten los embudos del Nivel 2 (ADR-086). Corre DENTRO del
 * manejador de un fallo, y de ahi salen sus tres reglas.
 *
 * 1. EL LOG PRIMERO. Es lo barato y lo que nunca lanza, asi que si asentar
 *    revienta el fallo original ya esta a salvo en disco.
 * 2. TRAGA SU ERROR. Perder la observacion no empeora el fallo; propagarla, si.
 * 3. NO SE REENTRA. Asentar abre la base, y el fallo tipico del arranque es que
 *    la base NO abre: sin candado, asentar volveria a lanzar, ese throw entraria
 *    aqui otra vez y el arranque roto seria un bucle.
 *
 * Vivia dentro de `embudo-de-arranque` cuando habia un solo embudo. Se saca al
 * llegar el segundo, porque la red no es del arranque: es de los tres. Dejarla
 * copiada seria la misma divergencia que ADR-084 pago dos veces.
 */
export function conRed(
  sumidero: SumideroDeFallos,
  que: string,
  nota: SelfNoteDraft,
  error: unknown,
  projectId?: string
): void {
  if (dentro) return
  dentro = true
  try {
    sumidero.registrar(que, error)
    sumidero.asentar(nota, projectId)
  } catch {
    // El fallo original ya esta en el log. Perder su observacion no lo empeora.
  } finally {
    dentro = false
  }
}

/** El `name` de lo que sea que se haya lanzado. Un `throw 'texto'` o un `throw
 *  null` son legales, asi que leer la propiedad a ciegas lanzaria DENTRO de la
 *  red — el bucle que el candado existe para cortar, por la puerta de al lado. */
export function nombreDelError(error: unknown): unknown {
  return (error as { name?: unknown } | null | undefined)?.name
}
