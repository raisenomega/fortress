import Anthropic from '@anthropic-ai/sdk'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import { CHAT_MODEL } from './anthropic-assistant'

/**
 * Comprueba la key pidiendo la ficha del modelo. Valida autenticacion y acceso
 * al modelo sin consumir tokens de generacion.
 *
 * La llamada sale del proceso principal: la key no viaja a ningun sitio salvo
 * a la API de Anthropic.
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyVerdict> {
  // Timeout corto y un solo reintento: es una comprobacion interactiva, el
  // operador esta esperando delante de la pantalla.
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 15_000 })

  try {
    const model = await client.models.retrieve(CHAT_MODEL)
    return { status: 'valida', model: model.display_name }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { status: 'invalida', reason: 'La API key no es valida o fue revocada.' }
    }
    if (error instanceof Anthropic.PermissionDeniedError) {
      return { status: 'invalida', reason: `Esa key no tiene acceso a ${CHAT_MODEL}.` }
    }
    if (error instanceof Anthropic.NotFoundError) {
      return { status: 'invalida', reason: `El modelo ${CHAT_MODEL} no esta disponible.` }
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { status: 'sin-verificar', reason: 'Sin conexion con la API de Claude.' }
    }
    const detail = error instanceof Error ? error.message : 'fallo desconocido'
    return { status: 'sin-verificar', reason: `No se pudo verificar: ${detail}` }
  }
}
