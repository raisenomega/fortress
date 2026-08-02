import { PUSH_REASON, type PushState } from '@domain/project/push-readiness'
import { Icon } from '../common/Icon'

interface PushButtonProps {
  readonly state: PushState
  readonly pushing: boolean
  readonly onPush: () => void
}

/**
 * El motivo del bloqueo va en el title y a la vista, no solo en el color: un
 * boton apagado sin explicacion parece un fallo de la app, no una decision.
 */
export function PushButton({ state, pushing, onPush }: PushButtonProps): React.JSX.Element {
  const blocked = state !== 'listo'

  return (
    <button
      type="button"
      onClick={onPush}
      disabled={blocked || pushing}
      title={PUSH_REASON[state]}
      className={`tap flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
        blocked
          ? 'border-critical/40 bg-critical/10 text-critical'
          : 'border-success/40 bg-success/10 text-success hover:brightness-125'
      }`}
    >
      <Icon name={blocked ? 'shield-off' : 'git-branch'} size={13} />
      {pushing ? 'Pusheando...' : blocked ? 'Push bloqueado' : 'git push'}
    </button>
  )
}
