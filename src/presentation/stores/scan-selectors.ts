import type { Finding } from '@domain/project/project'
import { EMPTY_COUNTS, type SeverityCounts } from '@domain/project/severity-counts'
import { useScanStore } from './scan-store'

/**
 * Referencias estables para lo vacio. Devolver un objeto nuevo en cada render
 * haria que zustand viera siempre un snapshot distinto y React entraria en un
 * bucle infinito de actualizacion.
 */
const NO_FINDINGS: readonly Finding[] = []

export function useProjectFindings(projectId: string | null): readonly Finding[] {
  return useScanStore((state) =>
    projectId ? (state.byProject[projectId] ?? NO_FINDINGS) : NO_FINDINGS
  )
}

export function useProjectCounts(projectId: string | null): SeverityCounts {
  return useScanStore((state) =>
    projectId ? (state.counts[projectId] ?? EMPTY_COUNTS) : EMPTY_COUNTS
  )
}

/** El error pertenece al proyecto que lo produjo, no a la pantalla. */
export function useScanError(projectId: string | null): string | null {
  return useScanStore((state) =>
    state.lastError?.projectId === projectId ? state.lastError.message : null
  )
}
