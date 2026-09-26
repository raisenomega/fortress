import { useState } from 'react'
import type { AgentHealth } from '@domain/omega/agent-health'
import { OmegaAgentSelect } from './OmegaAgentSelect'

interface OmegaCompareProps {
  readonly agents: readonly AgentHealth[]
}

const ROWS: ReadonlyArray<readonly [string, (a: AgentHealth) => string]> = [
  ['Confiabilidad', (a) => (a.compliance === null ? 's/d' : `${a.compliance}%`)],
  ['Tokens/ejec', (a) => (a.tokensPerRun === null ? 's/d' : String(a.tokensPerRun))],
  ['Discrepancias', (a) => String(a.discrepancies)],
  ['Ejecuciones', (a) => String(a.runs)],
  ['Fallos', (a) => String(a.failed)]
]

const show = (a: AgentHealth | undefined, pick: (x: AgentHealth) => string): string =>
  a ? pick(a) : '—'

/** Comparativa cruzada de 2 agentes (spec §8) con sus datos reales. */
export function OmegaCompare({ agents }: OmegaCompareProps): React.JSX.Element {
  const [left, setLeft] = useState(agents[0]?.agentId ?? '')
  const [right, setRight] = useState(agents[1]?.agentId ?? '')
  const a = agents.find((x) => x.agentId === left)
  const b = agents.find((x) => x.agentId === right)

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <OmegaAgentSelect
          label="Primer agente a comparar"
          agents={agents}
          value={left}
          onChange={setLeft}
        />
        <span className="text-muted-foreground">vs</span>
        <OmegaAgentSelect
          label="Segundo agente a comparar"
          agents={agents}
          value={right}
          onChange={setRight}
        />
      </div>
      <table className="w-full">
        <tbody>
          {ROWS.map(([label, pick]) => (
            <tr key={label} className="border-b border-border">
              <td className="px-2 py-1 text-muted-foreground">{label}</td>
              <td className="px-2 py-1 text-right text-foreground">{show(a, pick)}</td>
              <td className="px-2 py-1 text-right text-foreground">{show(b, pick)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
