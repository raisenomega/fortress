import { useState } from 'react'
import type { AgentHealth } from '@domain/omega/agent-health'

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

const SEL = 'rounded border border-border bg-card px-1 py-0.5 text-xs text-foreground'
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
        <select value={left} onChange={(e) => setLeft(e.target.value)} className={SEL}>
          {agents.map((x) => (
            <option key={x.agentId} value={x.agentId}>{x.name}</option>
          ))}
        </select>
        <span className="text-muted-foreground">vs</span>
        <select value={right} onChange={(e) => setRight(e.target.value)} className={SEL}>
          {agents.map((x) => (
            <option key={x.agentId} value={x.agentId}>{x.name}</option>
          ))}
        </select>
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
