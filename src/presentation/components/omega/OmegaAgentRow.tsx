import type { AgentHealth } from '@domain/omega/agent-health'

interface OmegaAgentRowProps {
  readonly agent: AgentHealth
  readonly selected: boolean
  readonly onSelect: () => void
}

const compliance = (value: number | null): string => (value === null ? '—' : `${value}%`)
const tone = (value: number | null): string =>
  value === null ? 'text-muted-foreground' : value >= 75 ? 'text-success' : 'text-critical'

/** Una fila de la tabla macro: salud real de un agente. Click abre su perfil. */
export function OmegaAgentRow({ agent, selected, onSelect }: OmegaAgentRowProps): React.JSX.Element {
  return (
    <tr
      onClick={onSelect}
      className={`tap cursor-pointer border-b border-border ${selected ? 'bg-accent/30' : ''}`}
    >
      <td className="px-2 py-1 text-foreground">{agent.name}</td>
      <td className="px-2 py-1 text-right text-muted-foreground">{agent.runs}</td>
      <td className="px-2 py-1 text-right text-muted-foreground">{agent.failed}</td>
      <td className={`px-2 py-1 text-right ${tone(agent.compliance)}`}>
        {compliance(agent.compliance)}
      </td>
      <td className="px-2 py-1 text-right text-muted-foreground">{agent.outputTokens}</td>
    </tr>
  )
}
