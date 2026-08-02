import type { Result } from '../shared/result'
import type { ApiKeyVerdict } from './api-key-check'

/**
 * Puerto de almacenamiento de la API key. La implementacion decide como
 * cifrarla; el dominio solo exige que nunca se guarde en claro.
 */
export interface ApiKeyStore {
  save(plainKey: string): Result<null>
  /** En claro. Solo debe invocarse desde el proceso principal. */
  read(): string | null
  has(): boolean
  clear(): void
}

/** Puerto de verificacion contra el proveedor real. */
export interface ApiKeyValidator {
  validate(apiKey: string): Promise<ApiKeyVerdict>
}
