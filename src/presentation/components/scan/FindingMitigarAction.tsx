import { useState } from 'react'
import { RotateCcw, Wrench } from 'lucide-react'
import type { Finding } from '@domain/project/finding'
import { ConfirmMitigado } from './ConfirmMitigado'

interface FindingMitigarActionProps {
  readonly finding: Finding
  readonly dismissed: boolean
  readonly mitigado: boolean
  readonly onMitigate: (id: string, nota: string) => void
  readonly onUnmitigate: () => void
}

const BOTON = 'tap mr-2 text-muted-foreground hover:text-foreground'

/**
 * "Ya esta arreglado" y su deshacer, con el dialogo que pide la nota.
 *
 * Vive aparte de `FindingActions` porque ahora tiene ESTADO —el modal abierto—
 * y descartar no lo tiene: dejarlo alli obligaria a la fila entera a cargar con
 * el estado de un dialogo que solo usa uno de sus botones.
 *
 * Se declara una vez y no dos veces por rama: mitigado ensena el deshacer,
 * descartado no ensena nada —no hay nada que declarar sobre lo que ya se dijo
 * que no era un problema— y el resto, la llave.
 */
export function FindingMitigarAction(props: FindingMitigarActionProps): React.JSX.Element | null {
  const { finding, dismissed, mitigado, onMitigate, onUnmitigate } = props
  const [preguntando, setPreguntando] = useState(false)

  if (mitigado) {
    return (
      <button
        type="button"
        onClick={onUnmitigate}
        title="Deshacer: vuelve a la cola del motor"
        className={BOTON}
      >
        <RotateCcw size={13} aria-hidden />
      </button>
    )
  }
  if (dismissed) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setPreguntando(true)}
        title="Marcar como ya arreglado: sale de la cola del motor y sigue visible"
        className={BOTON}
      >
        <Wrench size={13} aria-hidden />
      </button>

      {preguntando ? (
        <ConfirmMitigado
          finding={finding}
          onCancel={() => setPreguntando(false)}
          onConfirm={(nota) => {
            setPreguntando(false)
            onMitigate(finding.id, nota)
          }}
        />
      ) : null}
    </>
  )
}
