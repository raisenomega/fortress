import { exportOmega, runAudit } from '../../services/omega-service'
import { useUiStore } from '../../stores/ui-store'

interface OmegaProfileActionsProps {
  readonly projectId: string
  readonly busy: boolean
}

const BTN = 'tap rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground'

/**
 * Acciones rapidas del agente, solo las honestas: OMEGA es testigo, no actor.
 * Reiniciar/restringir/bloquear/eliminar quedan fuera a proposito.
 */
export function OmegaProfileActions({ projectId, busy }: OmegaProfileActionsProps): React.JSX.Element {
  const setView = useUiStore((state) => state.setView)

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void runAudit(projectId)}
        disabled={busy}
        className="tap rounded border border-primary/50 px-2 py-1 text-xs text-primary disabled:opacity-50"
      >
        Auditar
      </button>
      <button type="button" className={BTN} onClick={() => exportOmega(projectId)}>
        Exportar perfil
      </button>
      <button type="button" className={BTN} onClick={() => setView('actividad')}>
        Ver logs
      </button>
    </div>
  )
}
