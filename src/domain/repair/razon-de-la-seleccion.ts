import { DEBUT } from './debut'
import { surface, type Candidate } from './select-target'

/**
 * La justificacion trazable de una eleccion de la cola: QUE se eligio y POR QUE
 * ese. Va al libro de vida de la propuesta, asi que dice los criterios en el
 * orden en que mandan —desde ADR-106, la severidad primero— y no en el orden en
 * que se escribieron.
 *
 * Vive aparte de `selectTarget` porque son dos sujetos: uno decide, el otro
 * cuenta lo decidido, y juntos ya no cabian en un archivo.
 */
export function razonDeLaSeleccion(target: Candidate): string {
  return (
    `${target.title} (${target.file}:${target.line}, ${target.severity}). Elegido: MAS GRAVE ` +
    `de los elegibles (${DEBUT.join('/')}); a igual severidad, MENOR superficie ` +
    `(${surface(target)}), el mas antiguo sin atender (${target.firstSeen}) y la carpeta ` +
    `menos cargada. Contenido y verificable.`
  )
}
