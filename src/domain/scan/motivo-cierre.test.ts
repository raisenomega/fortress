import { describe, expect, it } from 'vitest'
import { aMotivoCierre, MOTIVOS_CIERRE } from './motivo-cierre'

/** Lo que puede llegar de una columna sin CHECK, incluido lo casi-correcto. */
const FUERA_DEL_VOCABULARIO = ['COMPLETO', 'terminado', 'time-out', '', null, undefined, 0, {}]

describe('aMotivoCierre', () => {
  it.each(MOTIVOS_CIERRE)('conserva %s, que esta en el vocabulario', (motivo) => {
    expect(aMotivoCierre(motivo)).toBe(motivo)
  })

  it.each(FUERA_DEL_VOCABULARIO)('%s cae a abortado', (valor) => {
    expect(aMotivoCierre(valor)).toBe('abortado')
  })

  it('el centinela NO es `completo`: un motivo ilegible no afirma que termino', () => {
    // Es la diferencia entre "no se que paso" y "salio bien", y confundirlas
    // contaria como escaneos completos los que murieron sin decir por que.
    expect(aMotivoCierre('vete a saber')).not.toBe('completo')
    expect(aMotivoCierre('vete a saber')).toBe('abortado')
  })
})
