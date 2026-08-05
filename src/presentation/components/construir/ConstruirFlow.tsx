import { useConstruirStore } from '../../stores/construir-store'
import { buildApproved, preparePlan } from '../../services/construir-service'
import { Notice } from '../common/Notice'
import { ConstruirForm } from './ConstruirForm'
import { ConstruirReview } from './ConstruirReview'

interface ConstruirFlowProps {
  readonly projectId: string
}

/** Maquina de fases: idle -> planning -> review -> building -> done/error. */
export function ConstruirFlow({ projectId }: ConstruirFlowProps): React.JSX.Element {
  const phase = useConstruirStore((s) => s.phase)
  const message = useConstruirStore((s) => s.message)
  const reset = useConstruirStore((s) => s.reset)

  if (phase === 'idle') {
    return <ConstruirForm onPrepare={(intent) => void preparePlan(projectId, intent)} />
  }
  if (phase === 'planning') {
    return <p className="text-sm text-muted-foreground">Disenando el plan...</p>
  }
  if (phase === 'review') {
    return (
      <ConstruirReview
        onApprove={() => {
          const { intent, plan } = useConstruirStore.getState()
          void buildApproved(projectId, intent, plan)
        }}
        onCancel={reset}
      />
    )
  }
  if (phase === 'building') {
    return <p className="text-sm text-muted-foreground">Construyendo con red git+verify...</p>
  }

  return (
    <div className="space-y-3">
      <Notice tone={phase === 'done' ? 'ok' : 'error'}>{message}</Notice>
      <button
        type="button"
        onClick={reset}
        className="tap rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/40"
      >
        Nueva construccion
      </button>
    </div>
  )
}
