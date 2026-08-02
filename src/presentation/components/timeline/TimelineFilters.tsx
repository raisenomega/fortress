import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { ACTIVITY_KINDS } from '@domain/telemetry/activity'
import type { ActivityFilter } from '@domain/telemetry/filter-activity'
import { SEVERITIES } from '@domain/shared/severity'

const SELECT = 'rounded-md border border-border bg-secondary px-2 py-1 text-xs text-foreground'

interface TimelineFiltersProps {
  readonly filter: ActivityFilter
  readonly onChange: (filter: ActivityFilter) => void
}

/** Cadena vacia en el desplegable significa "no filtrar por esto". */
const orNull = (value: string): null | string => (value === '' ? null : value)

export function TimelineFilters({ filter, onChange }: TimelineFiltersProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Filtrar por agente"
        value={filter.agentId ?? ''}
        onChange={(e) => onChange({ ...filter, agentId: orNull(e.target.value) as never })}
        className={SELECT}
      >
        <option value="">Todos los agentes</option>
        {AGENT_CATALOG.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por severidad"
        value={filter.severity ?? ''}
        onChange={(e) => onChange({ ...filter, severity: orNull(e.target.value) as never })}
        className={SELECT}
      >
        <option value="">Cualquier severidad</option>
        {SEVERITIES.map((severity) => (
          <option key={severity} value={severity}>
            {severity}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por tipo"
        value={filter.kind ?? ''}
        onChange={(e) => onChange({ ...filter, kind: orNull(e.target.value) as never })}
        className={SELECT}
      >
        <option value="">Cualquier accion</option>
        {ACTIVITY_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {kind}
          </option>
        ))}
      </select>
    </div>
  )
}
