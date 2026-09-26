import { useState } from 'react'
import { isTerminal, type Proposal } from '@domain/repair/proposal'
import { retirarPropuesta } from '../../services/retirada-service'
import { Icon } from '../common/Icon'
import { ConfirmRetirada } from './ConfirmRetirada'

interface RepairRetirarButtonProps {
  readonly proposal: Proposal
  /** Refetch INCONDICIONAL al terminar: sin stale closure (leccion I3.1). */
  readonly onDone?: () => void
}

/**
 * La salida de una propuesta viva, y la unica. Hasta ahora solo se podia
 * avanzar: firmar, reintentar, o esperar a que el motor la caducara. La que no
 * admitiera ninguna de las tres se quedaba viva para siempre y su hallazgo
 * fuera de la cola con ella.
 *
 * Solo en las NO terminales: una propuesta muerta ya no se retira, y pintar el
 * boton ahi seria ofrecer un acto que el caso de uso rechaza.
 *
 * Pregunta antes de hacerlo. Es irreversible y sus dos consecuencias no se
 * deducen del boton; viven en la confirmacion.
 */
export function RepairRetirarButton({
  proposal,
  onDone
}: RepairRetirarButtonProps): React.JSX.Element | null {
  const [preguntando, setPreguntando] = useState(false)
  const [busy, setBusy] = useState(false)
  if (isTerminal(proposal.state)) return null

  const retirar = async (motivo: string): Promise<void> => {
    setPreguntando(false)
    setBusy(true)
    try {
      await retirarPropuesta(proposal, motivo)
    } finally {
      setBusy(false)
      onDone?.()
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => setPreguntando(true)}
        title="Retirar: la caduca y saca de la cola. Su hallazgo vuelve"
        className="tap border-border text-muted-foreground hover:border-critical/50 hover:text-critical flex min-h-6 shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
      >
        <span className={busy ? 'animate-spin' : ''}>
          <Icon name={busy ? 'refresh-cw' : 'x-circle'} size={10} />
        </span>
        {busy ? 'Retirando...' : 'Retirar'}
      </button>

      {preguntando ? (
        <ConfirmRetirada
          proposal={proposal}
          onCancel={() => setPreguntando(false)}
          onConfirm={(motivo) => void retirar(motivo)}
        />
      ) : null}
    </>
  )
}
