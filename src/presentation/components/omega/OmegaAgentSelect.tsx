import type { AgentHealth } from '@domain/omega/agent-health'

interface OmegaAgentSelectProps {
  /** El nombre accesible. Sin el, un lector anuncia dos «cuadro combinado»
   *  identicos y no hay forma de saber cual de los dos agentes se esta eligiendo. */
  readonly label: string
  readonly agents: readonly AgentHealth[]
  readonly value: string
  readonly onChange: (agentId: string) => void
}

const SEL = 'rounded border border-border bg-card px-1 py-0.5 text-xs text-foreground'

/** Uno de los dos desplegables de la comparativa de agentes. */
export function OmegaAgentSelect({
  label,
  agents,
  value,
  onChange
}: OmegaAgentSelectProps): React.JSX.Element {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={SEL}
    >
      {agents.map((x) => (
        <option key={x.agentId} value={x.agentId}>
          {x.name}
        </option>
      ))}
    </select>
  )
}
