import { isInvalid, type ApiKeyVerdict } from '@domain/settings/api-key-check'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Verifica la key contra la API antes de guardarla. Una key invalida no se
 * guarda: hacerlo solo aplaza el error hasta el primer chat. Una que no se
 * pudo verificar (sin red) si se guarda, avisando.
 */
export async function saveApiKey(
  context: AppContext,
  plainKey: string
): Promise<Result<ApiKeyVerdict>> {
  const trimmed = plainKey.trim()
  if (trimmed.length === 0) return err('La API key esta vacia')

  const verdict = await context.apiKeyValidator.validate(trimmed)
  if (isInvalid(verdict)) return err(verdict.reason)

  const stored = context.apiKeys.save(trimmed)
  if (!stored.ok) return err(stored.error)

  return ok(verdict)
}

/** Revalida la key ya guardada, sin exponerla. */
export async function checkStoredApiKey(context: AppContext): Promise<ApiKeyVerdict> {
  const apiKey = context.apiKeys.read()
  if (!apiKey) {
    return { status: 'invalida', reason: 'No hay API key configurada.' }
  }
  return context.apiKeyValidator.validate(apiKey)
}
