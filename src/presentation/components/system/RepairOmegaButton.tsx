import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { api } from '../../adapters/fortress-api'
import { loadRepair } from '../../services/repair-service'
import { reportError } from '../../stores/toast-store'
import { Icon } from '../common/Icon'

interface RepairOmegaButtonProps {
  readonly proposal: Proposal
  /** Refetch INCONDICIONAL al terminar: sin stale closure (leccion I3.1). */
  readonly onDone?: () => void
}

/** I4 — el juicio semantico. Solo para GATE (gate ya pasado). Explicito. */
export function RepairOmegaButton({
  proposal,
  onDone
}: RepairOmegaButtonProps): React.JSX.Element | null {
  // prettier-ignore
  const [busy, setBusy] = useState(false)
  if (proposal.state !== 'GATE') return null

  const run = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await api().repair.runOmega(proposal.id)
      if (!result.ok) reportError(`OMEGA: ${result.reason}`)
    } catch (error) {
      reportError(error instanceof Error ? error.message : 'Fallo al correr OMEGA')
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
      className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground mx-2 mb-1 flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase disabled:opacity-60"
    >
      <span className={busy ? 'animate-spin' : ''}>
        <Icon name={busy ? 'refresh-cw' : 'eye'} size={10} />
      </span>
      {busy ? 'OMEGA juzgando...' : 'Correr OMEGA'}
    </button>
  )
}
