import { useState } from 'react'
import { Wrench } from 'lucide-react'
import type { Finding } from '@domain/project/finding'
import { AccionesDelMitigado } from './AccionesDelMitigado'
import { ConfirmMitigado } from './ConfirmMitigado'

interface FindingMitigarActionProps {
  readonly finding: Finding
  readonly dismissed: boolean
  readonly mitigado: boolean
  readonly onMitigate: (id: string, nota: string) => void
  readonly onUnmitigate: () => void
  /** Pedir al analista que compruebe el arreglo (ADR-087). Ausente mientras el
   *  motor esta ocupado: detras hay un solo carril y el main lo rechazaria. */
  readonly onVerificar: () => void
  readonly ocupado: boolean
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
  const { finding, dismissed, mitigado, onMitigate, onUnmitigate, onVerificar, ocupado } = props
  const [preguntando, setPreguntando] = useState(false)

  if (mitigado) {
    return (
      <AccionesDelMitigado
        onVerificar={onVerificar}
        onUnmitigate={onUnmitigate}
        ocupado={ocupado}
      />
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
