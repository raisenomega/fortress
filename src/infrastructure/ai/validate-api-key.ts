import Anthropic from '@anthropic-ai/sdk'
import type { ApiKeyVerdict } from '@domain/settings/api-key-check'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { modeloDeLaApi } from './modelo-de-la-api'

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
    // El modelo que el chat USARA: el alias del reparto, resuelto en el catalogo.
    const model = await modeloDeLaApi(client.models, MODELO_POR_ROL.chatApi)
    if (model === null) return { status: 'invalida', reason: `Esa key no ofrece ningun modelo ${MODELO_POR_ROL.chatApi}.` } // prettier-ignore
    return { status: 'valida', model: model.nombre }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { status: 'invalida', reason: 'La API key no es valida o fue revocada.' }
    }
    if (error instanceof Anthropic.PermissionDeniedError) {
      return { status: 'invalida', reason: `Esa key no tiene acceso a ${MODELO_POR_ROL.chatApi}.` }
    }
    if (error instanceof Anthropic.NotFoundError) {
      return { status: 'invalida', reason: `El modelo ${MODELO_POR_ROL.chatApi} no esta disponible.` }
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { status: 'sin-verificar', reason: 'Sin conexion con la API de Claude.' }
    }
    const detail = error instanceof Error ? error.message : 'fallo desconocido'
    return { status: 'sin-verificar', reason: `No se pudo verificar: ${detail}` }
  }
}
