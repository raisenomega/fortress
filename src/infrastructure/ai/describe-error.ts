import Anthropic from '@anthropic-ai/sdk'

/**
 * Traduce los fallos del SDK a algo accionable. Se usan las clases tipadas del
 * SDK, nunca comparaciones de texto sobre el mensaje.
 */
export function describeAssistantError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return 'La API key de Claude no es valida. Revisala en Ajustes.'
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return 'Esa API key no tiene permiso para el modelo solicitado.'
  }
  if (error instanceof Anthropic.RateLimitError) {
    return 'Limite de peticiones alcanzado. Espera unos segundos y reintenta.'
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return 'No se pudo conectar con la API de Claude. Revisa tu conexion.'
  }
  if (error instanceof Anthropic.APIError) {
    return `La API de Claude devolvio un error (${error.status}): ${error.message}`
  }
  return error instanceof Error ? error.message : 'Fallo desconocido al hablar con Claude'
}
