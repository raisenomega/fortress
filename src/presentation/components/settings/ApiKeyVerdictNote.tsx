import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import type { IconName } from '@domain/shared/icon-name'
import { Icon } from '../common/Icon'

const TONE: Record<ApiKeyVerdict['status'], string> = {
  valida: 'border-success/40 bg-success/10 text-success',
  invalida: 'border-critical/40 bg-critical/10 text-critical',
  'sin-verificar': 'border-medium/40 bg-medium/10 text-medium'
}

const ICON: Record<ApiKeyVerdict['status'], IconName> = {
  valida: 'check-circle',
  invalida: 'x-circle',
  'sin-verificar': 'alert-triangle'
}

interface ApiKeyVerdictNoteProps {
  readonly verdict: ApiKeyVerdict
}

export function ApiKeyVerdictNote({ verdict }: ApiKeyVerdictNoteProps): React.JSX.Element {
  const message =
    verdict.status === 'valida'
      ? `Key verificada contra la API. Modelo disponible: ${verdict.model}.`
      : verdict.reason

  // `role="status"` sin condicion: a diferencia de Notice, este veredicto no
  // vive dentro del Toaster, asi que no hay region viva que lo anuncie dos veces.
  return (
    <p
      role="status"
      className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${TONE[verdict.status]}`}
    >
      <Icon name={ICON[verdict.status]} size={13} className="mt-px shrink-0" />
      {message}
    </p>
  )
}
