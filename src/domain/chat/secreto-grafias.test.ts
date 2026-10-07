import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/** PASO 73.1: las configs reales escriben la clave secreta en TODAS las
 *  grafias — camel, snake y pegada en minusculas. La regla debe cazarlas
 *  todas, y eximir a las legitimas TAMBIEN en todas. */
describe('todas las grafias de la clave secreta caen', () => {
  it.each([
    '{"api_key":"v123456"}',
    '{"apikey":"v123456"}',
    '{"auth_token":"v123456"}',
    '{"client_secret":"v123456"}',
    '{"access_key":"v123456"}',
    '{"private_key":"v123456"}',
    '{"API_KEY":"v123456"}'
  ])('%s -> tachado y RE-PARSEA', (entrada) => {
    const salida = redactSecrets(entrada)
    expect(salida).not.toContain('v123456')
    expect(salida).toContain('***')
    expect(() => JSON.parse(salida)).not.toThrow()
  })
})

describe('las legitimas, a salvo TAMBIEN en snake_case', () => {
  it.each(['public_key', 'primary_key', 'sort_key', 'partition_key', 'foreign_key'])(
    '{"%s":"abc123"} NO se tacha',
    (clave) => {
      const texto = `{"${clave}":"abc123"}`
      expect(redactSecrets(texto)).toBe(texto)
    }
  )
})
