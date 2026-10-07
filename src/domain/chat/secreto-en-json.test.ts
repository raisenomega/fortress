import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/** La fuga del PASO 72: la comilla de cierre de la clave rompia el `[=:]` de
 *  las reglas por nombre y {"apiKey":"v"} pasaba ENTERO a todo lo persistido. */
describe('el secreto generico en JSON se tacha por su CLAVE, acotado por la comilla', () => {
  it.each([
    ['{"apiKey":"v123456"}', '{"apiKey":"***"}'],
    ['{"token":"abcdef12"}', '{"token":"***"}'],
    ['{"password":"hunter22"}', '{"password":"***"}'],
    ['{"client_secret":"zz-99"}', '{"client_secret":"***"}'],
    ['{"secretKey":"abc12345"}', '{"secretKey":"***"}'],
    ['{"encryptionKey":"abc12345"}', '{"encryptionKey":"***"}']
  ])('%s -> %s y RE-PARSEA', (entrada, esperado) => {
    const salida = redactSecrets(entrada)
    expect(salida).toBe(esperado)
    expect(() => JSON.parse(salida)).not.toThrow()
  })

  it('el anidado ESCAPADO tambien: el secreto dentro de un string-JSON', () => {
    const salida = redactSecrets('{"cfg":"{\\"apiKey\\":\\"v123456\\"}"}')
    expect(salida).not.toContain('v123456')
    expect(salida).toContain('apiKey')
    expect(() => JSON.parse(salida)).not.toThrow()
  })

  it('acotado por la comilla: lo de AL LADO del valor sobrevive intacto', () => {
    const salida = redactSecrets('{"token":"abcdef12","file":"a.ts","line":3}')
    expect(salida).toBe('{"token":"***","file":"a.ts","line":3}')
  })

  it('candado: las por-VALOR siguen funcionando dentro de JSON', () => {
    expect(redactSecrets('{"k":"sk-ant-api03-abcdef"}')).toBe('{"k":"***"}')
  })

  it('candado: un valor NUMERICO no se toca (los contadores *_tokens viven en paz)', () => {
    const texto = '{"input_tokens":123,"output_tokens":456}'
    expect(redactSecrets(texto)).toBe(texto)
  })
})
