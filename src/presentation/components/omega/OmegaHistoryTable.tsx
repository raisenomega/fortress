import type { AgentRun } from '@domain/telemetry/agent-run'
import { onActivate } from '../common/activate'
import { OmegaHistoryPager } from './OmegaHistoryPager'

interface OmegaHistoryTableProps {
  readonly runs: readonly AgentRun[]
  readonly page: number
  readonly pages: number
  readonly onPage: (page: number) => void
  readonly onRow: (run: AgentRun) => void
}

const PER_PAGE = 6

/** Historial paginado: 6 filas por pagina; click en una abre su barra lateral. */
export function OmegaHistoryTable(props: OmegaHistoryTableProps): React.JSX.Element {
  const { runs, page, pages, onPage, onRow } = props
  const slice = runs.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  if (runs.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin ejecuciones registradas.</p>
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-border rounded-md border border-border">
        {slice.map((run) => (
          <li
            key={run.id}
            role="button"
            tabIndex={0}
            onClick={() => onRow(run)}
            onKeyDown={onActivate(() => onRow(run))}
            className="tap flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary/40"
          >
            <span className={run.failed ? 'text-critical' : 'text-success'}>
              {run.failed ? 'fallo' : 'ok'}
            </span>
            <span className="text-muted-foreground">{run.kind}</span>
            <span className="text-muted-foreground">{run.usage.outputTokens} tok</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              {run.at.slice(0, 16).replace('T', ' ')}
            </span>
          </li>
        ))}
      </ul>
      <OmegaHistoryPager page={page} pages={pages} onPage={onPage} />
    </div>
  )
}
