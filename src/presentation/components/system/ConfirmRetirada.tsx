import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { Modal } from '../common/Modal'

interface ConfirmRetiradaProps {
  readonly proposal: Proposal
  readonly onCancel: () => void
  readonly onConfirm: (motivo: string) => void
}

const CAMPO =
  'border-border bg-background/40 text-foreground placeholder:text-muted-foreground w-full rounded-md border px-2 py-1.5 text-xs'

/**
 * Retirar es irreversible y tiene dos consecuencias que el boton no ensena, asi
 * que se dicen aqui antes de pulsar.
 *
 * La primera es la que sorprende: el hallazgo NO desaparece con la propuesta,
 * vuelve a la cola. Es lo correcto —retirar un intento no dice nada del defecto
 * que lo motivo—, pero quien retira porque el problema ya esta cubierto espera
 * lo contrario, y el sitio para eso es el Escaneo.
 *
 * La segunda es que queda escrito. El motivo es opcional; si no se escribe, el
 * asiento lo dice en vez de inventar una justificacion que nadie dio.
 */
export function ConfirmRetirada(props: ConfirmRetiradaProps): React.JSX.Element {
  const { proposal, onCancel, onConfirm } = props
  const [motivo, setMotivo] = useState('')

  return (
    <Modal title="Retirar esta propuesta" onClose={onCancel}>
      <div className="space-y-3">
        <p className="text-foreground text-sm">
          Queda caducada en {proposal.state} y sale del expediente. No hay deshacer.
        </p>
        <label className="block space-y-1">
          <span className="text-muted-foreground text-xs">Motivo (opcional)</span>
          <input
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="por que no procede seguir con ella"
            className={CAMPO}
          />
        </label>
        <p className="text-muted-foreground text-xs">
          Su hallazgo vuelve a la cola de reparacion. Si no quieres que vuelva, porque ya esta
          cubierto, marcalo en el Escaneo.
        </p>
        <p className="text-medium text-xs">
          La retirada queda asentada en el Libro de la Vida con tu motivo, y de ahi no se borra.
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
            onClick={() => onConfirm(motivo)}
            className="tap bg-primary text-background rounded-md px-3 py-1.5 text-xs font-semibold hover:brightness-110"
          >
            Retirar
          </button>
        </div>
      </div>
    </Modal>
  )
}
