import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { firmarPropuesta } from '../../services/firma-service'
import { Icon } from '../common/Icon'
import { esFirmable, queFirma } from './acto-de-firmar'

interface RepairFirmaButtonProps {
  readonly proposal: Proposal
  /** Refetch INCONDICIONAL al terminar: sin stale closure (leccion I3.1). */
  readonly onDone?: () => void
}

/**
 * La firma, en la fila de su propuesta. Sustituye al viejo "Correr OMEGA": en
 * GATE los dos hacian exactamente lo mismo —disparar el juicio— y tener dos
 * botones con nombres distintos para un solo acto se lee como dos opciones.
 *
 * `firmarPropuesta` decide sola segun el estado, asi que este boton no repite
 * esa regla: solo se pinta donde hay algo que firmar y dice en su titulo que
 * esta autorizando. Firmar cambia el estado, la propuesta sale de la cola por
 * si misma y la relectura del expediente trae la siguiente: el relevo no se
 * programa aqui.
 */
export function RepairFirmaButton({
  proposal,
  onDone
}: RepairFirmaButtonProps): React.JSX.Element | null {
  const [busy, setBusy] = useState(false)
  if (!esFirmable(proposal.state)) return null

  const firmar = async (): Promise<void> => {
    setBusy(true)
    try {
      await firmarPropuesta(proposal)
    } finally {
      setBusy(false)
      onDone?.()
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void firmar()}
      title={queFirma(proposal.state)}
      className="border-primary/50 text-primary hover:bg-primary/10 mx-2 mb-1 flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
    >
      <span className={busy ? 'animate-spin' : ''}>
        <Icon name={busy ? 'refresh-cw' : 'eye'} size={10} />
      </span>
      {busy ? 'Firmando...' : 'Firmar'}
    </button>
  )
}
