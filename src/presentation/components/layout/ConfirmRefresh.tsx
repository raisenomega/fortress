import { Modal } from '../common/Modal'

interface ConfirmRefreshProps {
  readonly jobs: number
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/** Se pregunta porque el trabajo en curso se pierde: es irreversible. */
export function ConfirmRefresh({
  jobs,
  onCancel,
  onConfirm
}: ConfirmRefreshProps): React.JSX.Element {
  return (
    <Modal title="Reiniciar en caliente" onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          Hay {jobs} {jobs === 1 ? 'proceso' : 'procesos'} de Claude Code en marcha. Reiniciar los
          termina y se pierde ese trabajo.
        </p>
        <p className="text-xs text-muted-foreground">
          Tus proyectos, hallazgos e historial no se tocan: solo se vacia la cache y se recarga la
          interfaz.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="tap rounded-md bg-critical px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:brightness-110"
          >
            Terminar y reiniciar
          </button>
        </div>
      </div>
    </Modal>
  )
}
