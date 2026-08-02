import { create } from 'zustand'
import { EMPTY_DRAFT, type NewProjectDraft } from '@domain/newproject/new-project-draft'

interface NewProjectState {
  readonly draft: NewProjectDraft
  /** Ruta final calculada, ya visible antes de crear nada. */
  readonly target: string | null
  /** Lo que ya hay en esa carpeta, si existe y tiene contenido. */
  readonly existing: string | null
  readonly useExisting: boolean
  readonly error: string | null
  /** Carpeta creada. A partir de aqui empiezan las fases siguientes. */
  readonly createdPath: string | null
  patch: (patch: Partial<NewProjectDraft>) => void
  setPlan: (target: string | null, existing: string | null) => void
  setUseExisting: (useExisting: boolean) => void
  setError: (error: string | null) => void
  setCreated: (path: string | null) => void
  reset: () => void
}

export const useNewProjectStore = create<NewProjectState>((set) => ({
  draft: EMPTY_DRAFT,
  target: null,
  existing: null,
  useExisting: false,
  error: null,
  createdPath: null,

  patch: (patch) => set((state) => ({ draft: { ...state.draft, ...patch }, error: null })),
  setPlan: (target, existing) => set({ target, existing }),
  setUseExisting: (useExisting) => set({ useExisting }),
  setError: (error) => set({ error }),
  setCreated: (createdPath) => set({ createdPath }),
  reset: () =>
    set({
      draft: EMPTY_DRAFT,
      target: null,
      existing: null,
      useExisting: false,
      error: null,
      createdPath: null
    })
}))
