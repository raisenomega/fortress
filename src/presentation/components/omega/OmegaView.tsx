import { runAudit } from '../../services/omega-service'
import { useOmega, useOmegaStore } from '../../stores/omega-store'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { Icon } from '../common/Icon'
import { OmegaLogList } from './OmegaLogList'
import { OmegaScorePanel } from './OmegaScorePanel'

/**
 * Panel de SENTINEL OMEGA. Vista comparativa honesta: la puntuacion con datos
 * reales y el Libro de la Vida (lo reportado vs lo verificado contra el disco).
 * Solo lectura + un boton para auditar; nunca se borra ni se edita nada.
 */
export function OmegaView(): React.JSX.Element {
  const project = useActiveProject()
  const data = useOmega(project?.id ?? null)
  const auditing = useOmegaStore((state) => state.auditing)

  if (!project) {
    return <EmptyState iconName="eye" title="Ningun proyecto" hint="Elige un proyecto para auditar." />
  }

  const busy = auditing === project.id

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <header className="flex items-center gap-2">
        <Icon name="eye" size={16} className="text-primary" />
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">Sentinel Omega</h2>
        <button
          type="button"
          onClick={() => void runAudit(project.id)}
          disabled={busy}
          className="tap ml-auto rounded border border-primary/40 px-2 py-1 text-xs text-primary disabled:opacity-50"
        >
          {busy ? 'Auditando…' : 'Auditar'}
        </button>
      </header>

      <OmegaScorePanel score={data.score} />

      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Libro de la Vida — reportado vs verificado
        </h3>
        <OmegaLogList entries={data.log} />
      </section>
    </div>
  )
}
