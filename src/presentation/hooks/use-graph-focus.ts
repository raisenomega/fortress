import { useEffect } from 'react'
import { api } from '../adapters/fortress-api'
import { useProjectStore } from '../stores/project-store'

/**
 * Al cambiar el proyecto activo, avisa al main (projects:focus) para que
 * reconcilie su grafo en background. Fire-and-forget: la UI nunca espera.
 */
export function useGraphFocus(): void {
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  useEffect(() => {
    if (activeProjectId !== null) void api().graph.focus(activeProjectId)
  }, [activeProjectId])
}
