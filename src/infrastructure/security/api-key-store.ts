import { safeStorage } from 'electron'
import { SETTINGS_KEYS, type SettingsRepository } from '@domain/settings/settings-repository'
import { err, ok, type Result } from '@domain/shared/result'

const UNAVAILABLE =
  'El sistema no ofrece almacenamiento cifrado (falta un keyring). ' +
  'Configura ANTHROPIC_API_KEY en el entorno en vez de guardarla aqui.'

/**
 * La API key se guarda cifrada con safeStorage (keychain del sistema operativo)
 * y nunca en texto plano ni en el repositorio (R1). Solo el proceso principal
 * la descifra: jamas cruza el puente al renderer.
 */
export function saveApiKey(settings: SettingsRepository, plainKey: string): Result<null> {
  const trimmed = plainKey.trim()
  if (trimmed.length === 0) return err('La API key esta vacia')
  if (!safeStorage.isEncryptionAvailable()) return err(UNAVAILABLE)

  const encrypted = safeStorage.encryptString(trimmed).toString('base64')
  settings.set(SETTINGS_KEYS.encryptedApiKey, encrypted)
  return ok(null)
}

/** Devuelve la key en claro solo dentro del proceso principal. */
export function readApiKey(settings: SettingsRepository): string | null {
  const stored = settings.get(SETTINGS_KEYS.encryptedApiKey)
  if (!stored) return process.env.ANTHROPIC_API_KEY?.trim() || null
  if (!safeStorage.isEncryptionAvailable()) return null

  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'))
  } catch {
    // Cambio de keyring o perfil: la key guardada ya no se puede descifrar.
    return null
  }
}

export function hasApiKey(settings: SettingsRepository): boolean {
  return readApiKey(settings) !== null
}

export function clearApiKey(settings: SettingsRepository): void {
  settings.set(SETTINGS_KEYS.encryptedApiKey, '')
}
