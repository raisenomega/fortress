import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { api } from '../../adapters/fortress-api'
import { loadRepair } from '../../services/repair-service'
import { reportError } from '../../stores/toast-store'
import { Icon } from '../common/Icon'

interface RepairGateButtonProps {
  readonly proposal: Proposal
  /** Al terminar (verde o rojo): la fila refresca su libro. */
  readonly onDone?: () => void
}

/**
 * I3 — el juicio hermetico del fix: npm ci + typecheck + lint + test:unit
 * DENTRO del worktree. Minutos, no segundos. Explicito por propuesta, solo
 * para GENERADO. La cola de 1 serializa si hay otro gate corriendo.
 */
export function RepairGateButton({
  proposal,
  onDone
}: RepairGateButtonProps): React.JSX.Element | null {
  // prettier-ignore
  const [busy, setBusy] = useState(false)
  if (proposal.state !== 'GENERADO') return null

  const run = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await api().repair.runGate(proposal.id)
      if (!result.ok) reportError(`Gate: ${result.reason}`)
    } catch (error) {
      reportError(error instanceof Error ? error.message : 'Fallo al correr el gate')
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
      onClick={() => void run()}
      className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground flex min-h-6 shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
    >
      <span className={busy ? 'animate-spin' : ''}>
        <Icon name={busy ? 'refresh-cw' : 'shield'} size={10} />
      </span>
      {busy ? 'Gate corriendo...' : 'Correr gate'}
    </button>
  )
}
