import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { api } from '../../adapters/fortress-api'
import { loadRepair } from '../../services/repair-service'
import { reportError } from '../../stores/toast-store'
import { Icon } from '../common/Icon'

interface RepairGenerateButtonProps {
  readonly proposal: Proposal
  /** Se invoca al terminar (exito o rechazo): la fila refresca su libro. */
  readonly onDone?: () => void
}

/**
 * C3 — el boton que dispara la generacion del fix en el worktree aislado.
 * Solo existe para ANALIZADO(REAL). Explicito por propuesta: sin automacion.
 */
export function RepairGenerateButton({
  proposal,
  onDone
}: RepairGenerateButtonProps): React.JSX.Element | null {
  const [busy, setBusy] = useState(false)
  if (proposal.state !== 'ANALIZADO' || proposal.analysisVerdict !== 'REAL') return null

  const generate = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await api().repair.generate(proposal.id)
      if (!result.ok) reportError(`Generacion rechazada: ${result.reason}`)
    } catch (error) {
      reportError(error instanceof Error ? error.message : 'Fallo al generar el fix')
    } finally {
      setBusy(false)
      await loadRepair(proposal.projectId)
      onDone?.()
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void generate()}
      className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
    >
      <span className={busy ? 'animate-spin' : ''}>
        <Icon name={busy ? 'refresh-cw' : 'wrench'} size={10} />
      </span>
      {busy ? 'Generando fix...' : 'Generar fix'}
    </button>
  )
}
