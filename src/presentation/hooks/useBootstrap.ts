import { useEffect } from 'react'
import { loadHistory } from '../services/chat-service'
import { runHealthCheck } from '../services/health-service'
import { loadProjects } from '../services/project-service'
import { loadCounts, loadFindings } from '../services/scan-service'
import { loadOperationMode, refreshApiKeyStatus } from '../services/settings-service'
import { refreshSessionUsage } from '../services/telemetry-service'
import { useProjectStore } from '../stores/project-store'

/**
 * Carga inicial desde SQLite y recarga del historial cada vez que cambia el
 * proyecto activo. Cada proyecto tiene su propia conversacion.
 */
export function useBootstrap(): void {
  const activeProjectId = useProjectStore((state) => state.activeProjectId)

  useEffect(() => {
    void loadProjects()
    // Los conteos alimentan el estado de push de todas las tarjetas.
    void loadCounts()
    void refreshSessionUsage()
    void refreshApiKeyStatus()
    void loadOperationMode()
    // Diagnostico automatico al abrir la app.
    void runHealthCheck()
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    void loadHistory(activeProjectId)
    void loadFindings(activeProjectId)
  }, [activeProjectId])
}
