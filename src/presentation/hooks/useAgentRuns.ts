import { useEffect, useState } from 'react'
import type { AgentRun } from '@domain/telemetry/agent-run'
import { fetchAgentRuns } from '../services/omega-service'

/** Carga las ejecuciones de un agente (cruzando proyectos) para su pagina. */
export function useAgentRuns(agentId: string): readonly AgentRun[] {
  const [runs, setRuns] = useState<readonly AgentRun[]>([])

  useEffect(() => {
    let live = true
    void fetchAgentRuns(agentId).then((r) => live && setRuns(r))
    return () => {
      live = false
    }
  }, [agentId])

  return runs
}
