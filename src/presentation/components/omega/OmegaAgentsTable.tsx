import { useState } from 'react'
import type { AgentHealth } from '@domain/omega/agent-health'
import { sortAgents, type SortKey } from '@domain/omega/agent-sort'
import { OmegaAgentRow } from './OmegaAgentRow'

const COLS: ReadonlyArray<readonly [string, SortKey | null]> = [
  ['Agente', 'name'],
  ['Confiab.', 'compliance'],
  ['Eficien.', 'tokensPerRun'],
  ['Profund.', null],
  ['Discrep.', 'discrepancies'],
  ['Omision.', null]
]

interface OmegaAgentsTableProps {
  readonly agents: readonly AgentHealth[]
  readonly selected: string | null
  readonly onSelect: (agentId: string) => void
}

/** Vista macro (spec §2): 5 columnas, ordenables por click, colores por umbral. */
export function OmegaAgentsTable({ agents, selected, onSelect }: OmegaAgentsTableProps): React.JSX.Element {
  const [key, setKey] = useState<SortKey>('discrepancies')
  const [asc, setAsc] = useState(false)
  const activos = agents.filter((a) => a.runs > 0).length
  const click = (k: SortKey | null): void => {
    if (!k) return
    if (k === key) setAsc(!asc)
    else {
      setKey(k)
      setAsc(false)
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <div className="border-b border-border bg-secondary/40 px-2 py-1 text-[10px] tracking-widest text-muted-foreground uppercase">
        Agentes del sistema ({activos}/{agents.length} con actividad)
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {COLS.map(([label, k], i) => (
              <th
                key={label}
                onClick={() => click(k)}
                className={`px-2 py-1 font-medium ${i === 0 ? 'text-left' : 'text-right'} ${k ? 'tap cursor-pointer' : ''}`}
              >
                {label}
                {k === key ? (asc ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortAgents(agents, key, asc).map((agent) => (
            <OmegaAgentRow
              key={agent.agentId}
              agent={agent}
              selected={selected === agent.agentId}
              onSelect={() => onSelect(agent.agentId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
