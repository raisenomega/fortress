import type { ApiKeyVerdict } from '@domain/settings/api-key-check'

const TONE: Record<ApiKeyVerdict['status'], string> = {
  valida: 'border-success/40 bg-success/10 text-success',
  invalida: 'border-critical/40 bg-critical/10 text-critical',
  'sin-verificar': 'border-medium/40 bg-medium/10 text-medium'
}

const ICON: Record<ApiKeyVerdict['status'], string> = {
  valida: '🟢',
  invalida: '🔴',
  'sin-verificar': '🟡'
}

interface ApiKeyVerdictNoteProps {
  readonly verdict: ApiKeyVerdict
}

export function ApiKeyVerdictNote({ verdict }: ApiKeyVerdictNoteProps): React.JSX.Element {
  const message =
    verdict.status === 'valida'
      ? `Key verificada contra la API. Modelo disponible: ${verdict.model}.`
      : verdict.reason

  return (
    <p className={`mt-3 rounded-md border px-3 py-2 text-xs ${TONE[verdict.status]}`}>
      {ICON[verdict.status]} {message}
    </p>
  )
}
