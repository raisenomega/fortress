import type { Project } from '@domain/project/project'
import { Modal } from '../common/Modal'

interface ConfirmRemoveProjectProps {
  readonly project: Project
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * Quitar un proyecto borra tambien su chat, sus hallazgos y su telemetria en
 * FORTRESS. Se pregunta porque eso no se deshace. La carpeta en disco no se
 * toca: si el operador vuelve a agregarla, empieza de cero.
 */
export function ConfirmRemoveProject({
  project,
  onCancel,
  onConfirm
}: ConfirmRemoveProjectProps): React.JSX.Element {
  return (
    <Modal title={`Quitar ${project.name}`} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-foreground">
          Se quita de FORTRESS junto con su chat, sus hallazgos y su historial de escaneos.
        </p>
        <p className="text-xs text-muted-foreground">
          La carpeta <span className="font-mono">{project.path}</span> no se toca. Puedes volver a
          agregarla cuando quieras; empezaria sin historial.
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
            Quitar proyecto
          </button>
        </div>
      </div>
    </Modal>
  )
}
