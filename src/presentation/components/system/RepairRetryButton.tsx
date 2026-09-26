import { useState } from 'react'
import type { Proposal } from '@domain/repair/proposal'
import { isRetryable } from '@domain/repair/retry-eligibility'
import { api } from '../../adapters/fortress-api'
import { loadRepair } from '../../services/repair-service'
import { reportError } from '../../stores/toast-store'
import { Icon } from '../common/Icon'

interface RepairRetryButtonProps {
  readonly proposal: Proposal
  /** Refetch INCONDICIONAL al terminar: sin stale closure (leccion I3.1). */
  readonly onDone?: () => void
}

/**
 * I4.2 — reintento explicito. Solo visible en RECHAZADOS de RAZONAMIENTO
 * (D24): crea una propuesta NUEVA sobre el HEAD actual con C2 fresco. Los
 * rechazos tecnicos no lo muestran: repetir sin arreglar la causa da lo mismo.
 */
export function RepairRetryButton({
  proposal,
  onDone
}: RepairRetryButtonProps): React.JSX.Element | null {
  // prettier-ignore
  const [busy, setBusy] = useState(false)
  if (!isRetryable(proposal.state, proposal.analysisReason)) return null

  const run = async (): Promise<void> => {
    setBusy(true)
    try {
      const result = await api().repair.retry(proposal.id)
      if (!result.ok) reportError(`Reintento: ${result.reason}`)
    } catch (error) {
      reportError(error instanceof Error ? error.message : 'Fallo al reintentar')
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
        <Icon name={busy ? 'refresh-cw' : 'rotate-ccw'} size={10} />
      </span>
      {busy ? 'Reintentando (C2 fresco)...' : 'Reintentar'}
    </button>
  )
}
