import { overview } from '@domain/omega/omega-overview'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { Icon } from '../common/Icon'
import { APP_VERSION } from '../common/Logo'
import { OmegaAlerts } from './OmegaAlerts'
import { OmegaHeaderActions } from './OmegaHeaderActions'

interface OmegaHeaderProps {
  readonly projectId: string
  readonly log: readonly OmegaEntry[]
  readonly busy: boolean
}

const sync = (at: string | null): string => (at ? at.slice(0, 19).replace('T', ' ') : '—')

/** Header global del superdashboard (spec §1). Metricas REALES del Libro de la Vida. */
export function OmegaHeader({ projectId, log, busy }: OmegaHeaderProps): React.JSX.Element {
  const o = overview(log)
  const integridad = o.integrity === null ? 's/d' : `${o.integrity}% de integridad`

  return (
    <header className="space-y-3 rounded-md border border-primary/30 bg-card p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Icon name="eye" size={18} className="text-primary" />
        <span className="text-sm font-semibold tracking-wide text-primary uppercase">Sentinel Omega</span>
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          el ojo que todo lo ve
        </span>
        <span className="ml-auto text-xs text-muted-foreground">Sistema: FORTRESS v{APP_VERSION}</span>
        <span className={`text-xs ${busy ? 'text-critical' : 'text-success'}`}>
          {busy ? 'Auditoria activa' : 'Observando'}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Ultima sincronizacion: {sync(o.lastAt)} · Registros: {o.records} · {integridad}
      </p>

      <OmegaAlerts overview={o} />
      <OmegaHeaderActions projectId={projectId} busy={busy} />
    </header>
  )
}
