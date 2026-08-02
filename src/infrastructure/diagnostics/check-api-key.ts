import type { AppContext } from '@application/context'
import { checkStoredApiKey } from '@application/settings/save-api-key'
import type { HealthCheck } from '@domain/health/health-check'

const ID = 'api-key'
const LABEL = 'API key de Claude'

const FIX_MISSING = 'Abre Configuracion y pega tu API key, o exporta ANTHROPIC_API_KEY.'
const FIX_INVALID = 'Abre Configuracion y pega una key valida: la guardada ya no sirve.'

/** Pregunta a la API de verdad: una key guardada puede haberse revocado. */
export async function checkApiKey(context: AppContext): Promise<HealthCheck> {
  if (!context.apiKeys.has()) {
    return {
      id: ID,
      label: LABEL,
      level: 'error',
      detail: 'Sin configurar — el chat no funcionara',
      fix: FIX_MISSING
    }
  }

  const verdict = await checkStoredApiKey(context)

  if (verdict.status === 'valida') {
    return {
      id: ID,
      label: LABEL,
      level: 'ok',
      detail: `Claude responde · ${verdict.model}`,
      fix: null
    }
  }
  if (verdict.status === 'sin-verificar') {
    return {
      id: ID,
      label: LABEL,
      level: 'warning',
      detail: verdict.reason,
      fix: 'Revisa tu conexion a internet.'
    }
  }
  return { id: ID, label: LABEL, level: 'error', detail: verdict.reason, fix: FIX_INVALID }
}
