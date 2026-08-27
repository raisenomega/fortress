import type { Project } from '@domain/project/project'
import { Modal } from '../common/Modal'

interface ConfirmDesbloqueoProps {
  readonly project: Project
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

const FORENSE =
  'max-h-48 overflow-y-auto rounded-md border border-border/60 bg-background/40 p-2.5 font-mono text-[11px] break-words text-muted-foreground'

/**
 * El forense va DELANTE del boton, y en eso consiste el componente entero.
 *
 * La marca la pone una auditoria que encontro el arbol cambiado; quitarla es
 * afirmar que eso ya se ha mirado. Sin el detalle a la vista, "Desbloquear"
 * seria un clic reflejo sobre algo que nadie leyo, y el asiento del Libro
 * acabaria diciendo que se autorizo justo lo que aqui no se enseno.
 */
export function ConfirmDesbloqueo(props: ConfirmDesbloqueoProps): React.JSX.Element {
  const { project, onCancel, onConfirm } = props

  return (
    <Modal title={`Desbloquear ${project.name}`} onClose={onCancel}>
      <div className="space-y-3">
        <p className="text-sm text-foreground">
          Esto es lo que la auditoria encontro alterado y no pudo devolver a su sitio:
        </p>
        <p className={FORENSE}>{project.contaminationDetail ?? 'La marca no dejo detalle.'}</p>
        <p className="text-xs text-muted-foreground">
          Al desbloquear, el proyecto vuelve a circulacion: los agentes pueden correr sobre el, y la
          firma y el push dejan de estar frenados.
        </p>
        <p className="text-medium text-xs">
          La decision queda asentada en el Libro de la Vida con este detalle, y de ahi no se borra.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="tap border-border text-muted-foreground hover:text-foreground rounded-md border px-3 py-1.5 text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="tap bg-primary text-background rounded-md px-3 py-1.5 text-xs font-semibold hover:brightness-110"
          >
            Desbloquear
          </button>
        </div>
      </div>
    </Modal>
  )
}
