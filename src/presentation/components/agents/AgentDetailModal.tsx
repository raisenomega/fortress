import { useEffect } from 'react'
import { findAgent } from '@domain/agent/agent-catalog'
import type { AgentId } from '@domain/agent/agent'
import { formatMoment } from '../../format/time'
import { loadAgentStats } from '../../services/agent-stats-service'
import { useAgentStatsStore } from '../../stores/agent-stats-store'
import { useActiveProject } from '../../stores/project-store'
import { Icon } from '../common/Icon'
import { Modal } from '../common/Modal'
import { AgentMetrics } from './AgentMetrics'
import { AgentTimeline } from './AgentTimeline'

interface AgentDetailModalProps {
  readonly agentId: AgentId
  readonly onClose: () => void
}

export function AgentDetailModal({ agentId, onClose }: AgentDetailModalProps): React.JSX.Element {
  const agent = findAgent(agentId)
  const project = useActiveProject()
  const stats = useAgentStatsStore((state) => state.stats)
  const loading = useAgentStatsStore((state) => state.loading)

  useEffect(() => {
    if (project) void loadAgentStats(agentId, project.id)
  }, [agentId, project])

  return (
    <Modal title={agent?.name ?? agentId} onClose={onClose}>
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          {agent ? <Icon name={agent.iconName} size={14} className="mt-0.5 text-primary" /> : null}
          {agent?.purpose}
        </p>

        {/* El ambito es el proyecto activo: decirlo evita leer estas cifras
            como si fueran de todos los repos. */}
        <p className="text-[11px] text-muted-foreground">
          En <span className="text-foreground">{project?.name ?? 'ningun proyecto'}</span>
          {stats?.totals.lastAt ? ` · ultimo uso ${formatMoment(stats.totals.lastAt)}` : ''}
        </p>

        {loading || !stats ? (
          <p className="text-xs text-muted-foreground">
            {loading ? 'Cargando...' : 'Sin datos de este agente todavia.'}
          </p>
        ) : (
          <>
            <AgentMetrics stats={stats} />
            <AgentTimeline entries={stats.recent} />
          </>
        )}
      </div>
    </Modal>
  )
}
