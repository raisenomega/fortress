import type { ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import type { AppContext } from '../context'
import { mitigado } from './elegir-para-verificar'
import { recorrerVerificaciones, type VerificacionMasivaDeps } from './recorrer-verificaciones'

export type { VerificacionMasivaDeps }

/**
 * Verifica TODOS los mitigados de un proyecto (ADR-087, Fase 3).
 *
 * Ya no lleva bucle: solo decide QUE lista, y el recorrido es de
 * `recorrerVerificaciones`. Las dos mitades se separaron al abrir la seleccion
 * manual —que es el mismo recorrido con otra lista— y la separacion sale gratis
 * porque el bucle nunca miro de la fila mas que su id.
 *
 * La lista se toma UNA vez, aqui, y ya no se vuelve a preguntar: un `sin_prueba`
 * sigue MITIGADO despues de verificarse, asi que re-preguntar elegiria el mismo
 * para siempre.
 */
export function verificarTodos(
  context: AppContext,
  projectId: string,
  deps: VerificacionMasivaDeps
): Promise<ResultadoVerificacionMasiva> {
  const ids = context.findings
    .listMemory(projectId)
    .filter(mitigado)
    .map((f) => f.id)

  return recorrerVerificaciones(context, projectId, ids, deps)
}
