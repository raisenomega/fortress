import { create } from 'zustand'
import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'

interface ProjectState {
  readonly projects: readonly ProyectoEnVista[]
  readonly activeProjectId: string | null
  readonly loading: boolean
  setProjects: (projects: readonly ProyectoEnVista[]) => void
  setActiveProject: (id: string | null) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProjectId: null,
  loading: false,

  setProjects: (projects) =>
    set((state) => ({
      projects,
      // Si el proyecto activo desaparecio, cae al primero disponible.
      activeProjectId:
        state.activeProjectId && projects.some((p) => p.id === state.activeProjectId)
          ? state.activeProjectId
          : (projects[0]?.id ?? null)
    })),

  setActiveProject: (activeProjectId) => set({ activeProjectId }),
  setLoading: (loading) => set({ loading })
}))

/** Proyecto activo resuelto, o null si no hay ninguno. */
export function useActiveProject(): ProyectoEnVista | null {
  return useProjectStore(
    (state) => state.projects.find((p) => p.id === state.activeProjectId) ?? null
  )
}
