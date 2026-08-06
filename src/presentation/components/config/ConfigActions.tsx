import { approveDoc, executeConfig, restartConfig } from '../../services/configuration-service'

interface ConfigActionsProps {
  readonly projectId: string
  readonly ready: boolean
  readonly canApprove: boolean
  readonly executing: boolean
  /** Un turno de entrevista esta en curso: no arrancar otro en paralelo. */
  readonly busy: boolean
}

const PRIMARY =
  'tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50'
const GHOST = 'tap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground'

/** Botonera de la fase de aprobacion. Nada se escribe sin "Si, ejecutar". */
export function ConfigActions(props: ConfigActionsProps): React.JSX.Element {
  const { projectId, ready, canApprove, executing, busy } = props
  return (
    <div className="mt-3 flex items-center gap-2">
      {ready ? (
        <button
          type="button"
          disabled={executing || busy}
          onClick={() => void executeConfig(projectId)}
          className={PRIMARY}
        >
          {executing ? 'Escribiendo...' : 'Si, ejecutar'}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canApprove}
          onClick={() => approveDoc(projectId)}
          className={PRIMARY}
        >
          Aprobar
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => restartConfig(projectId)}
        className={GHOST}
      >
        Empezar de nuevo
      </button>
    </div>
  )
}
