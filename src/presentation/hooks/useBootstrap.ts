import { useEffect } from 'react'
import { loadHistory } from '../services/chat-service'
import { subscribeLoopChat } from '../services/loop-chat'
import { subscribeLoop } from '../services/loop-service'
import { loadCognition } from '../services/cognition-service'
import { loadGraph } from '../services/graph-service'
import { loadOmega } from '../services/omega-service'
import { loadTimeline } from '../services/timeline-service'
import { runHealthCheck } from '../services/health-service'
import { loadProjects } from '../services/project-service'
import { loadCounts, loadFindings } from '../services/scan-service'
import { loadOperationMode, refreshApiKeyStatus } from '../services/settings-service'
import { loadAccount } from '../services/account-service'
import { loadBilling, refreshSessionUsage } from '../services/telemetry-service'
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
    void loadBilling()
    void loadAccount()
    void refreshApiKeyStatus()
    void loadOperationMode()
    // Diagnostico automatico al abrir la app.
    void runHealthCheck()
    // Estado del loop + su salida en vivo al chat; se cancelan al desmontar.
    const offLoop = subscribeLoop()
    const offChat = subscribeLoopChat()
    return () => {
      offLoop()
      offChat()
    }
  }, [])

  useEffect(() => {
    if (!activeProjectId) return
    void loadHistory(activeProjectId)
    void loadFindings(activeProjectId)
    void loadCognition(activeProjectId)
    void loadTimeline(activeProjectId)
    void loadGraph(activeProjectId)
    void loadOmega(activeProjectId)
  }, [activeProjectId])
}
