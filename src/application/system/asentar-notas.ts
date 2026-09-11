import { sinRepetidas } from '@domain/system/extraer-notas'
import type { Project } from '@domain/project/project'
import type { SelfNoteDraft } from '@domain/system/self-observation'
import type { AppContext } from '../context'

/**
 * Asienta lo que un agente noto de FORTRESS (ADR-085). Un solo sitio para los
 * tres que observan, y para los cinco que se engancharan despues.
 *
 * FUNDE LAS COPIAS antes de escribir, y eso es lo que impide que el escaneo
 * inunde el backlog: el escaner corre una vez por PARADA —doce en el recorrido
 * de Health Flow— y las doce se topan con el mismo limite de la herramienta.
 * Doce filas diciendo «el grafo no modela RLS» no son doce senales; son una
 * repetida, y adelantarian por mal diseno el ruido que la Fase 4 viene a quitar.
 *
 * El `sourceProject` y el `projectPath` los pone QUIEN ASIENTA, no el agente:
 * `SelfNoteDraft` no los lleva a proposito —un agente no sabe en que proyecto lo
 * lanzaron— y el `projectPath` ademas alimenta al cerco, que vive en `add`.
 *
 * Traga su error: perder una nota al margen no puede tumbar el escaneo ni el
 * veredicto que la traia. Misma regla que `toSelfNotes`, un paso mas abajo.
 */
export function asentarNotas(
  context: AppContext,
  project: Project,
  notas: readonly SelfNoteDraft[]
): number {
  const unicas = sinRepetidas(notas)

  try {
    for (const nota of unicas) {
      context.selfObservations.add({
        ...nota,
        sourceProject: project.name,
        projectPath: project.path
      })
    }
    return unicas.length
  } catch (error) {
    console.error('[ADR-085] no se pudieron asentar las observaciones', error)
    return 0
  }
}

/**
 * La misma puerta cuando quien llama solo tiene el ID. El motor trabaja con
 * `proposal.projectId` y no con la fila entera; resolverlo aqui evita que cada
 * llamante repita la busqueda y el `if` del proyecto que ya no existe.
 */
export function asentarNotasDelProyecto(
  context: AppContext,
  projectId: string,
  notas: readonly SelfNoteDraft[]
): number {
  if (notas.length === 0) return 0
  const project = context.projects.findById(projectId)
  return project === null ? 0 : asentarNotas(context, project, notas)
}
