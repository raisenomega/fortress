import { create } from 'zustand'

export type SidebarSectionId = 'proyectos' | 'agentes'

interface SidebarState {
  /** Sidebar plegado a un carril de iconos, para ganar pantalla. */
  readonly collapsed: boolean
  /** Secciones cerradas. Por defecto todas abiertas. */
  readonly closed: readonly SidebarSectionId[]
  toggleCollapsed: () => void
  toggleSection: (id: SidebarSectionId) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  closed: [],

  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

  toggleSection: (id) =>
    set((state) => ({
      closed: state.closed.includes(id)
        ? state.closed.filter((entry) => entry !== id)
        : [...state.closed, id]
    }))
}))

export function useSectionOpen(id: SidebarSectionId): boolean {
  return useSidebarStore((state) => !state.closed.includes(id))
}
