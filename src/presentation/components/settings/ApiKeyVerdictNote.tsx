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
  /** Sin rol propio: para cuando ya vive DENTRO de ApiKeyVerdictRegion, como
   *  la prop homonima de Notice. Dos regiones anidadas anuncian dos veces. */
  readonly callado?: boolean
}

export function ApiKeyVerdictNote({ verdict, callado }: ApiKeyVerdictNoteProps): React.JSX.Element {
  const message =
    verdict.status === 'valida'
      ? `Key verificada contra la API. Modelo disponible: ${verdict.model}.`
      : verdict.reason

  return (
    <p
      role={callado ? undefined : 'status'}
      className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${TONE[verdict.status]}`}
    >
      <Icon name={ICON[verdict.status]} size={13} className="mt-px shrink-0" />
      {message}
    </p>
  )
}

/** Region viva siempre montada: solo cambia su contenido (veredicto o nada),
 *  asi el anuncio es fiable. Vacia no ocupa sitio: el margen va en la nota. */
export function ApiKeyVerdictRegion({
  verdict
}: {
  readonly verdict: ApiKeyVerdict | null
}): React.JSX.Element {
  return (
    <div role="status">{verdict ? <ApiKeyVerdictNote verdict={verdict} callado /> : null}</div>
  )
}
