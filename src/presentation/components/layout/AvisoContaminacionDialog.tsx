import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'
import { Modal } from '../common/Modal'

interface AvisoContaminacionDialogProps {
  readonly project: ProyectoEnVista
  readonly onClose: () => void
}

const CAJA =
  'max-h-64 overflow-y-auto rounded border border-border bg-background/40 p-2.5 font-mono text-[11px] break-words text-muted-foreground'

/**
 * PASO 172c: el detalle del aviso de contaminación de un CLIENTE, en un diálogo
 * (el chip del header lo abre). INFORMATIVO: sin botón de desbloqueo —el cliente
 * nunca se congela y la marca se limpia sola en la próxima auditoría limpia—.
 */
export function AvisoContaminacionDialog({
  project,
  onClose
}: AvisoContaminacionDialogProps): React.JSX.Element {
  return (
    <Modal title={`Aviso de «${project.name}»`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-foreground">
          La última auditoría de calidad detectó archivos cambiados durante el chequeo (suelen ser
          de build, regenerables). No bloquea nada: puedes seguir trabajando, y se limpia sola en la
          próxima auditoría que salga limpia.
        </p>
        <p className={CAJA}>{project.contaminationDetail ?? 'Sin detalle.'}</p>
      </div>
    </Modal>
  )
}
