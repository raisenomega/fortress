import { exportOmega, runAudit } from '../../services/omega-service'
import { useUiStore } from '../../stores/ui-store'

interface OmegaAgentHeaderProps {
  readonly name: string
  readonly subtitle: string
  readonly score: number | null
  readonly runs: number
  readonly tokens: number
  readonly discrepancies: number
  readonly projectId: string
  readonly busy: boolean
}

const BTN =
  'tap rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground'

/** Header propio del agente, mismo estilo que el de OMEGA: titulo "Agente X",
 *  sus responsabilidades, cifras, barra a 1/4 y acciones del agente debajo. */
export function OmegaAgentHeader(props: OmegaAgentHeaderProps): React.JSX.Element {
  const { name, subtitle, score, runs, tokens, discrepancies, projectId, busy } = props
  const setView = useUiStore((state) => state.setView)
  const tone = score !== null && score >= 75 ? 'bg-success' : 'bg-critical'

  return (
    <header className="space-y-2 rounded-md border border-primary/30 bg-card p-3">
      <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">Agente {name}</h2>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      <p className="text-xs text-muted-foreground">
        {runs} ejecuciones · {discrepancies} discrepancias · {tokens} tokens · Score{' '}
        {score === null ? 's/d' : `${score}%`}
      </p>
      <div className="w-1/4 min-w-[140px] space-y-1">
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Efectividad</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${score ?? 0}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void runAudit(projectId)}
          disabled={busy}
          className="tap rounded border border-primary/50 px-2 py-1 text-xs text-primary disabled:opacity-50"
        >
          Ejecutar
        </button>
        <button type="button" className={BTN} onClick={() => setView('rendimiento')}>
          Ver estadisticas
        </button>
        <button type="button" className={BTN} onClick={() => exportOmega(projectId)}>
          Exportar
        </button>
      </div>
    </header>
  )
}
