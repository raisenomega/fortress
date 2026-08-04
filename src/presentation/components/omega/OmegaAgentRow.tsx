import type { AgentHealth } from '@domain/omega/agent-health'

interface OmegaAgentRowProps {
  readonly agent: AgentHealth
  readonly selected: boolean
  readonly onSelect: () => void
}

const pct = (v: number | null): string => (v === null ? 's/d' : `${v}%`)
const tone = (v: number | null): string =>
  v === null ? 'text-muted-foreground' : v >= 75 ? 'text-success' : v >= 50 ? 'text-medium' : 'text-critical'

/**
 * Fila de la tabla macro (spec §2). Confiabilidad y eficiencia con datos reales;
 * profundidad y omisiones no las mide el sistema, asi que dicen s/d (no se
 * inventan). Discrepancias son verificables. Click abre el perfil.
 */
export function OmegaAgentRow({ agent, selected, onSelect }: OmegaAgentRowProps): React.JSX.Element {
  const cell = 'px-2 py-1 text-right'
  return (
    <tr onClick={onSelect} className={`tap cursor-pointer border-b border-border ${selected ? 'bg-accent/30' : ''}`}>
      <td className="px-2 py-1 text-foreground" title={agent.agentId}>{agent.name}</td>
      <td className={`${cell} ${tone(agent.compliance)}`} title="Ejecuciones sin fallo">
        {pct(agent.compliance)}
      </td>
      <td className={`${cell} text-muted-foreground`} title="Tokens de salida por ejecucion">
        {agent.tokensPerRun === null ? 's/d' : `${agent.tokensPerRun} tok`}
      </td>
      <td className={`${cell} text-muted-foreground`} title="OMEGA no mide profundidad; no se inventa">
        s/d
      </td>
      <td className={`${cell} ${agent.discrepancies > 0 ? 'text-critical' : 'text-muted-foreground'}`}
        title="Hallazgos que no cuadran con el disco">
        {agent.discrepancies}
      </td>
      <td className={`${cell} text-muted-foreground`} title="No es medible sin verdad de referencia">
        s/d
      </td>
    </tr>
  )
}
