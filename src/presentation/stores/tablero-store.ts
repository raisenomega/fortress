import { create } from 'zustand'
import type { FiltroDeEstado, FiltroDeSeveridad } from '@domain/project/filtro-del-tablero'
import { TODAS } from '@domain/project/filtro-del-tablero'
import { alternarTodos, alternarUno, podarSet } from './algebra-de-seleccion'

/** Lo vacio, con referencia estable: devolver un `Set` nuevo en cada lectura
 *  haria que zustand viera siempre un snapshot distinto y React no parara. */
export const SIN_SELECCION: ReadonlySet<string> = new Set()

interface TableroState {
  readonly severidad: Readonly<Record<string, FiltroDeSeveridad>>
  readonly estado: Readonly<Record<string, FiltroDeEstado>>
  readonly seleccion: Readonly<Record<string, ReadonlySet<string>>>
  setSeveridad: (projectId: string, valor: FiltroDeSeveridad) => void
  setEstado: (projectId: string, valor: FiltroDeEstado) => void
  alternar: (projectId: string, findingId: string) => void
  /** El atajo de la cabecera: suma las visibles, o las resta si ya estaban. */
  alternarVisibles: (projectId: string, ids: readonly string[]) => void
  limpiar: (projectId: string) => void
  /** Quita del Set los ids que ya no estan en la tabla. Ver `podar`. */
  podar: (projectId: string, presentes: readonly string[]) => void
}

/**
 * El estado de la VISTA del tablero, por proyecto. Vive aparte de `scan-store`
 * —que guarda los datos del escaneo— por el limite de 75 lineas y porque son dos
 * cosas: aquello es lo que la base dice, esto es lo que el operador esta
 * mirando. Por proyecto y no global: cambiar de proyecto y volver conserva tu
 * filtro y tu seleccion, que es como se trabaja de verdad.
 */
export const useTableroStore = create<TableroState>((set) => ({
  severidad: {},
  estado: {},
  seleccion: {},

  setSeveridad: (projectId, valor) =>
    set((s) => ({ severidad: { ...s.severidad, [projectId]: valor } })),

  setEstado: (projectId, valor) => set((s) => ({ estado: { ...s.estado, [projectId]: valor } })),

  alternar: (projectId, findingId) =>
    set((s) => ({
      seleccion: {
        ...s.seleccion,
        [projectId]: alternarUno(s.seleccion[projectId] ?? SIN_SELECCION, findingId)
      }
    })),

  alternarVisibles: (projectId, ids) =>
    set((s) => ({
      seleccion: {
        ...s.seleccion,
        [projectId]: alternarTodos(s.seleccion[projectId] ?? SIN_SELECCION, ids)
      }
    })),

  limpiar: (projectId) =>
    set((s) => ({ seleccion: { ...s.seleccion, [projectId]: SIN_SELECCION } })),

  podar: (projectId, presentes) =>
    set((s) => {
      const previo = s.seleccion[projectId]
      if (previo === undefined || previo.size === 0) return s
      const vivos = podarSet(previo, presentes)
      return vivos === previo ? s : { seleccion: { ...s.seleccion, [projectId]: vivos } }
    })
}))

export const filtroDe = (
  s: TableroState,
  projectId: string
): { severidad: FiltroDeSeveridad; estado: FiltroDeEstado } =>
  // prettier-ignore
  ({ severidad: s.severidad[projectId] ?? TODAS, estado: s.estado[projectId] ?? TODAS })
