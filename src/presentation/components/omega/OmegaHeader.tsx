import type { OmegaEntry } from '@domain/omega/omega-entry'
import { Icon } from '../common/Icon'

interface OmegaHeaderProps {
  readonly log: readonly OmegaEntry[]
  readonly busy: boolean
  readonly onAudit: () => void
}

/** Cabecera del superdashboard: metricas REALES contadas del Libro de la Vida. */
export function OmegaHeader({ log, busy, onAudit }: OmegaHeaderProps): React.JSX.Element {
  const discrepancias = log.filter((e) => e.verdict === 'discrepancia').length
  const vetos = log.filter((e) => e.verdict === 'veto').length
  const ultima = log[0]?.at ? log[0].at.slice(0, 19).replace('T', ' ') : '—'
  const stats: ReadonlyArray<readonly [string, string]> = [
    ['Registros', String(log.length)],
    ['Discrepancias', String(discrepancias)],
    ['Vetos', String(vetos)],
    ['Ultimo asiento', ultima]
  ]

  return (
    <header className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon name="eye" size={16} className="text-primary" />
        <span className="text-sm font-semibold tracking-wide text-primary uppercase">
          Sentinel Omega
        </span>
        <button
          type="button"
          onClick={onAudit}
          disabled={busy}
          className="tap ml-auto rounded border border-primary/40 px-2 py-1 text-xs text-primary disabled:opacity-50"
        >
          {busy ? 'Auditando…' : 'Ejecutar auditoria'}
        </button>
      </div>
      <dl className="grid grid-cols-4 gap-2 text-xs">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-card px-2 py-1.5">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  )
}
