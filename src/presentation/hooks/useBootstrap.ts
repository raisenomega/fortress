import { useEffect } from 'react'
import { loadHistory } from '../services/chat-service'
import { loadProjects } from '../services/project-service'
import { refreshApiKeyStatus } from '../services/settings-service'
import { useProjectStore } from '../stores/project-store'

/**
 * Carga inicial desde SQLite y recarga del historial cada vez que cambia el
 * proyecto activo. Cada proyecto tiene su propia conversacion.
 */
export function useBootstrap(): void {
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  useEffect(() => {
    void loadProjects()
    void refreshApiKeyStatus()
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    void loadHistory(activeProjectId)
  }, [activeProjectId])
}
