import { exportOmega, loadOmega, runAudit } from '../../services/omega-service'
import { useUiStore } from '../../stores/ui-store'

interface OmegaHeaderActionsProps {
  readonly projectId: string
  readonly busy: boolean
}

const BTN =
  'tap rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground'

/** Las 4 acciones del header. Reales: recargar, exportar JSON, ir a ajustes, auditar. */
export function OmegaHeaderActions({
  projectId,
  busy
}: OmegaHeaderActionsProps): React.JSX.Element {
  const setView = useUiStore((state) => state.setView)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={BTN} onClick={() => void loadOmega(projectId)}>
        Actualizar
      </button>
      <button type="button" className={BTN} onClick={() => exportOmega(projectId)}>
        Exportar
      </button>
      <button type="button" className={BTN} onClick={() => setView('settings')}>
        Configurar
      </button>
      <button
        type="button"
        onClick={() => void runAudit(projectId)}
        disabled={busy}
        className="tap rounded border border-primary/50 px-2 py-1 text-xs text-primary disabled:opacity-50"
      >
        {busy ? 'Auditando…' : 'Ejecutar auditoria'}
      </button>
    </div>
  )
}
