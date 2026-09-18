import { loteDisponible } from '@domain/chat/lote-del-terminal'
import { prepararLote } from '../services/preparar-lote'
import { useColaDelLoteStore, type LoteEnCurso } from '../stores/cola-del-lote-store'
import { LOTE_VACIO, useLoteStore } from '../stores/lote-store'
import { useProjectStore } from '../stores/project-store'

/** Lo que la tabla necesita del lote para pintar la cajita de cada fila. */
export interface LoteEnLaTabla {
  readonly seleccion: ReadonlySet<string>
  readonly alternar: (findingId: string) => void
}

export interface LoteDelTablero {
  /** null: el lote no se ofrece aqui (el proyecto no es resoluble). */
  readonly enLaTabla: LoteEnLaTabla | null
  readonly elegidos: number
  readonly enCurso: LoteEnCurso | null
  /** El mensaje ya esta precargado en el Terminal, esperando el Enter. */
  readonly pendiente: boolean
  /** El plan ya esta escrito y el turno paro: falta el disparo que ejecuta, y
   *  ese vive al pie del plan, en el Terminal (`BotonDelPlan`). Aqui solo se
   *  usa para DECIRLO: desde el Escaneo ya no se aprueba. */
  readonly planeado: boolean
  /** En autonomo el lote no corre: su aprobador es OMEGA (pieza 5). */
  /** Deja el mensaje escrito en el Terminal. NO envia ni arranca nada. */
  readonly preparar: () => void
  readonly limpiar: () => void
}

/**
 * El lote al Terminal atado a su proyecto (ADR-088). Aqui se decide, y en ningun
 * otro sitio, si se ofrece: `resoluble`, del proceso principal, false en el repo
 * propio de FORTRESS. El MODO no lo esconde; decide el flujo (`prepararLote`).
 */
export function useLoteDelTablero(projectId: string, projectName: string): LoteDelTablero {
  // prettier-ignore
  const resoluble = useProjectStore((s) => s.projects.find((p) => p.id === projectId)?.resoluble === true)
  const seleccion = useLoteStore((s) => s.seleccion[projectId] ?? LOTE_VACIO)
  const enCurso = useColaDelLoteStore((s) =>
    s.enCurso?.projectId === projectId ? s.enCurso : null
  )
  // prettier-ignore
  const pendiente = useColaDelLoteStore((s) => s.pendiente !== null && s.pendiente.projectId === projectId)
  // prettier-ignore
  const planeado = useColaDelLoteStore((s) => s.pendiente?.projectId === projectId && s.pendiente.planeado)

  const alternar = (findingId: string): void => useLoteStore.getState().alternar(projectId, findingId) // prettier-ignore

  return {
    enLaTabla: loteDisponible(resoluble) ? { seleccion, alternar } : null,
    elegidos: seleccion.size,
    enCurso,
    pendiente,
    planeado,
    preparar: () => prepararLote(projectId, projectName),
    // Limpiar se lleva tambien el plan pendiente: si no, el lote seguiria
    // viajando con los mensajes libres de este proyecto (ver `lote-del-plan`).
    limpiar: () => {
      useLoteStore.getState().limpiar(projectId)
      if (pendiente) useColaDelLoteStore.getState().descartar()
    }
  }
}
