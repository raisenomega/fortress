import { overview } from '@domain/omega/omega-overview'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { useOmegaStore, type OmegaMode } from '../../stores/omega-store'
import { Icon } from '../common/Icon'
import { APP_VERSION } from '../common/Logo'
import { OmegaAlerts } from './OmegaAlerts'
import { OmegaHeaderActions } from './OmegaHeaderActions'
import { OmegaTabs } from './OmegaTabs'

interface OmegaHeaderProps {
  readonly projectId: string
  readonly projectName: string
  readonly lastScan: string | null
  readonly log: readonly OmegaEntry[]
  readonly busy: boolean
}

const fmt = (at: string | null): string => (at ? at.slice(0, 19).replace('T', ' ') : '—')
const MODE_LABEL: Record<OmegaMode, string> = {
  agentes: 'Agentes',
  codigo: 'Codigo',
  proyectos: 'Proyectos',
  config: 'Configuracion'
}

/** Header global del superdashboard: identidad, pestañas, modo y estado del proyecto. */
export function OmegaHeader(props: OmegaHeaderProps): React.JSX.Element {
  const { projectId, projectName, lastScan, log, busy } = props
  const o = overview(log)
  const mode = useOmegaStore((s) => s.mode)
  const setMode = useOmegaStore((s) => s.setMode)
  const integridad = o.integrity === null ? 's/d' : `${o.integrity}%`

  return (
    <header className="space-y-3 rounded-md border border-primary/30 bg-card p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Icon name="eye" size={18} className="text-primary" />
        <span className="text-sm font-semibold tracking-wide text-primary uppercase">Sentinel Omega</span>
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          el ojo que todo lo ve
        </span>
        <span className="ml-auto text-xs text-muted-foreground">FORTRESS v{APP_VERSION}</span>
        <span className={`text-xs ${busy ? 'text-critical' : 'text-success'}`}>
          {busy ? 'Auditoria activa' : 'Observando'}
        </span>
      </div>
      <OmegaTabs active={mode} onSelect={setMode} />
      <p className="text-[11px] text-muted-foreground">
        Modo actual: <span className="text-foreground uppercase">{MODE_LABEL[mode]}</span> ·
        Proyecto: {projectName} · Ultimo escaneo: {fmt(lastScan)} · Registros: {o.records} ·
        Integridad: {integridad}
      </p>
      <OmegaAlerts overview={o} />
      <OmegaHeaderActions projectId={projectId} busy={busy} />
    </header>
  )
}
