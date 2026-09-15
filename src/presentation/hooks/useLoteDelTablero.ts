import { loteDisponible, SUGERIDO_DEL_LOTE, TOPE_DEL_LOTE } from '@domain/chat/lote-del-terminal'
import { resolverLoteEnTerminal } from '../services/resolver-lote-en-terminal'
import { useColaDelLoteStore, type LoteEnCurso } from '../stores/cola-del-lote-store'
import { LOTE_VACIO, useLoteStore } from '../stores/lote-store'
import { useProjectStore } from '../stores/project-store'
import { useSettingsStore } from '../stores/settings-store'
import { notify } from '../stores/toast-store'

/** Lo que la tabla necesita del lote para pintar la cajita de cada fila. */
export interface LoteEnLaTabla {
  readonly seleccion: ReadonlySet<string>
  readonly alternar: (findingId: string) => void
}

export interface LoteDelTablero {
  /** null: el lote no se ofrece aqui (no resoluble, o en supervisado). */
  readonly enLaTabla: LoteEnLaTabla | null
  readonly elegidos: number
  readonly enCurso: LoteEnCurso | null
  readonly resolver: () => void
  readonly limpiar: () => void
}

/**
 * El lote al Terminal atado a su proyecto (ADR-088). Aqui se decide, y en ningun
 * otro sitio, si se ofrece: `resoluble` —del proceso principal, false en el repo
 * propio de FORTRESS— y el modo autonomo. La fila solo mira si le llega null.
 */
export function useLoteDelTablero(projectId: string): LoteDelTablero {
  // prettier-ignore
  const resoluble = useProjectStore((s) => s.projects.find((p) => p.id === projectId)?.resoluble === true)
  const mode = useSettingsStore((s) => s.mode)
  const seleccion = useLoteStore((s) => s.seleccion[projectId] ?? LOTE_VACIO)
  const enCurso = useColaDelLoteStore((s) =>
    s.enCurso?.projectId === projectId ? s.enCurso : null
  )

  const alternar = (findingId: string): void => {
    if (useLoteStore.getState().alternar(projectId, findingId)) return
    notify(`Un lote lleva como maximo ${TOPE_DEL_LOTE} hallazgos (sugerido: ${SUGERIDO_DEL_LOTE}).`)
  }

  return {
    enLaTabla: loteDisponible(resoluble, mode) ? { seleccion, alternar } : null,
    elegidos: seleccion.size,
    enCurso,
    resolver: () => void resolverLoteEnTerminal(projectId),
    limpiar: () => useLoteStore.getState().limpiar(projectId)
  }
}
