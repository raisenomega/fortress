import { safeStorage } from 'electron'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import { SETTINGS_KEYS, type SettingsRepository } from '@domain/settings/settings-repository'
import { err, ok } from '@domain/shared/result'

const UNAVAILABLE =
  'El sistema no ofrece almacenamiento cifrado (falta un keyring). ' +
  'Configura ANTHROPIC_API_KEY en el entorno en vez de guardarla aqui.'

/**
 * La API key se cifra con safeStorage (keychain del sistema operativo) y se
 * guarda solo en este equipo. Nunca en texto plano ni en el repositorio (R1).
 * Solo el proceso principal la descifra: jamas cruza el puente al renderer.
 */
export function createSafeStorageApiKeyStore(settings: SettingsRepository): ApiKeyStore {
  const read = (): string | null => {
    const stored = settings.get(SETTINGS_KEYS.encryptedApiKey)
    if (!stored) return process.env.ANTHROPIC_API_KEY?.trim() || null
    if (!safeStorage.isEncryptionAvailable()) return null

    try {
      return safeStorage.decryptString(Buffer.from(stored, 'base64'))
    } catch {
      // Cambio de keyring o de perfil: lo guardado ya no se puede descifrar.
      return null
    }
  }

  return {
    read,
    has: () => read() !== null,

    save: (plainKey) => {
      const trimmed = plainKey.trim()
      if (trimmed.length === 0) return err('La API key esta vacia')
      if (!safeStorage.isEncryptionAvailable()) return err(UNAVAILABLE)

      settings.set(
        SETTINGS_KEYS.encryptedApiKey,
        safeStorage.encryptString(trimmed).toString('base64')
      )
      return ok(null)
    },

    clear: () => settings.set(SETTINGS_KEYS.encryptedApiKey, '')
  }
}
