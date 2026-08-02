import type { ApiKeyValidator } from '@domain/settings/api-key-store'
import { validateApiKey } from './validate-api-key'

export function createAnthropicKeyValidator(): ApiKeyValidator {
  return { validate: validateApiKey }
}
