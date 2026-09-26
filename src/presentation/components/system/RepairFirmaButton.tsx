import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { firmarPropuesta } from '../../services/firma-service'
import { Icon } from '../common/Icon'
import { esFirmable, nombreDelActo, queFirma } from './acto-de-firmar'

interface RepairFirmaButtonProps {
  readonly proposal: Proposal
  /** Refetch INCONDICIONAL al terminar: sin stale closure (leccion I3.1). */
  readonly onDone?: () => void
}

/**
 * El acto que la propuesta espera, en su propia fila.
 *
 * `firmarPropuesta` decide sola que hacer segun el estado, asi que este boton
 * no repite esa regla: se pinta donde hay algo que hacer y se NOMBRA por lo que
 * va a pasar —pedir revision en GATE, firmar en OMEGA—, porque solo uno de los
 * dos mueve el repo. Al pulsar, el estado cambia, la propuesta sale de la cola
 * por si misma y la relectura trae la siguiente: el relevo no se programa aqui.
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
      className="border-primary/50 text-primary hover:bg-primary/10 flex min-h-6 shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
    >
      <span className={busy ? 'animate-spin' : ''}>
        <Icon name={busy ? 'refresh-cw' : 'eye'} size={10} />
      </span>
      {busy ? 'Trabajando...' : nombreDelActo(proposal.state)}
    </button>
  )
}
