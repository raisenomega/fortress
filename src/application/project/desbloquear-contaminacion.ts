import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * El operador reviso el detalle forense de un proyecto CONTAMINADO y lo devuelve
 * a circulacion. Es el inverso de la Capa 4, y el unico que hay: la marca la
 * pone una auditoria automatica, pero quitarla no lo decide ninguna maquina.
 *
 * Exige que este contaminado. Desbloquear lo que no esta bloqueado dejaria en el
 * Libro una autorizacion sin nada que autorizar, y ese asiento es lo unico que
 * despues explica por que un proyecto marcado volvio a operar.
 *
 * El forense se captura ANTES de limpiarlo: pasado `markClean` la columna es
 * NULL, y el asiento solo podria decir que se autorizo algo, no que se autorizo.
 *
 * El veredicto es 'info' y no 'ok': FORTRESS no ha comprobado que el arbol este
 * limpio —nadie lo ha hecho—, solo registra que un humano cargo con la decision.
 * El agente es null porque no hubo agente; fue el operador.
 */
export function desbloquearContaminacion(context: AppContext, id: string): Result<null> {
  const project = context.projects.findById(id)
  if (project === null) return err('Ese proyecto ya no existe')
  if (!project.contaminated) return err('Ese proyecto no esta bloqueado')

  const forense = project.contaminationDetail ?? '(la marca no dejo detalle)'
  context.projects.markClean(id)
  context.omegaLog.append({
    projectId: id,
    agentId: null,
    kind: 'nota',
    verdict: 'info',
    summary: `Desbloqueo manual: revisado el forense, ${project.name} vuelve a circulacion.`,
    evidence: forense
  })
  return ok(null)
}
