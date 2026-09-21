import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/**
 * `redactSecrets` corre en el proceso PRINCIPAL sobre texto que sale de un repo
 * auditado: una regla que se pueda hacer cuadratica es una forma de colgar la
 * app desde fuera. Va aparte de los tests de forma porque prueba otra cosa: no
 * QUE tacha, sino CUANTO tarda.
 */
describe('ninguna regla se puede usar para COLGAR el proceso principal', () => {
  // El texto sale de un repo AUDITADO. Una regla perezosa sin tope re-escanea
  // hasta el final por cada cabecera sin pie. MEDIDO con esta entrada: la
  // perezosa 7.900 ms (y 42 s con 4 MB), la acotada 17. Con 6.000 cabeceras la
  // perezosa daba 629 y este test pasaba por suerte: el tamano ES la prueba.
  it('decenas de miles de cabeceras PEM sin pie se procesan en tiempo lineal', () => {
    const hostil = `-----BEGIN ${'RSA PRIVATE'} KEY-----\n`.repeat(40_000) + 'x'.repeat(900_000)
    const t0 = performance.now()

    redactSecrets(hostil)

    expect(performance.now() - t0).toBeLessThan(1000)
  })
})
