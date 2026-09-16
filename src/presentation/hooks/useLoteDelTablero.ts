import { loteDisponible, SUGERIDO_DEL_LOTE, TOPE_DEL_LOTE } from '@domain/chat/lote-del-terminal'
import { prepararLote } from '../services/preparar-lote'
import { aprobarYResolver } from '../services/resolver-lote-en-terminal'
import { useColaDelLoteStore, type LoteEnCurso } from '../stores/cola-del-lote-store'
import { LOTE_VACIO, useLoteStore } from '../stores/lote-store'
import { useProjectStore } from '../stores/project-store'
import { notify } from '../stores/toast-store'

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
  /** Hay un plan precargado esperando aprobacion. */
  readonly pendiente: boolean
  /** Precarga el plan (o avisa en autonomo). NO arranca la cola. */
  readonly preparar: () => void
  /** Aprueba el plan: la cola corre los N turnos en edicion. */
  readonly aprobar: () => void
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

  const alternar = (findingId: string): void => {
    if (useLoteStore.getState().alternar(projectId, findingId)) return
    notify(`Un lote lleva como maximo ${TOPE_DEL_LOTE} hallazgos (sugerido: ${SUGERIDO_DEL_LOTE}).`)
  }

  return {
    enLaTabla: loteDisponible(resoluble) ? { seleccion, alternar } : null,
    elegidos: seleccion.size,
    enCurso,
    pendiente,
    preparar: () => prepararLote(projectId, projectName),
    aprobar: () => void aprobarYResolver(projectId),
    // Limpiar se lleva tambien el plan pendiente: si no, el lote seguiria
    // viajando con los mensajes libres de este proyecto (ver `lote-del-plan`).
    limpiar: () => {
      useLoteStore.getState().limpiar(projectId)
      if (pendiente) useColaDelLoteStore.getState().descartar()
    }
  }
}
