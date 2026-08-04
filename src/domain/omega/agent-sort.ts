import type { AgentHealth } from './agent-health'

/** Columnas ordenables de la tabla macro (las que tienen dato real). */
export type SortKey = 'name' | 'compliance' | 'tokensPerRun' | 'discrepancies'

function numeric(agent: AgentHealth, key: Exclude<SortKey, 'name'>): number | null {
  if (key === 'compliance') return agent.compliance
  if (key === 'tokensPerRun') return agent.tokensPerRun
  return agent.discrepancies
}

/** Ordena una copia. Los null (sin dato) van siempre al final, en cualquier sentido. */
export function sortAgents(
  agents: readonly AgentHealth[],
  key: SortKey,
  asc: boolean
): readonly AgentHealth[] {
  const dir = asc ? 1 : -1
  if (key === 'name') {
    return [...agents].sort((a, b) => a.name.localeCompare(b.name) * dir)
  }
  return [...agents].sort((a, b) => {
    const av = numeric(a, key)
    const bv = numeric(b, key)
    if (av === null) return 1
    if (bv === null) return -1
    return (av - bv) * dir
  })
}
