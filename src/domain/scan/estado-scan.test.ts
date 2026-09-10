import { describe, expect, it } from 'vitest'
import { aEstadoScan, ESTADOS_SCAN } from './estado-scan'

/**
 * Lo que puede llegar de una columna sin CHECK: otra caja de mayusculas, una
 * palabra de otro vocabulario, la cadena vacia, una columna nula o ausente, un
 * numero, y un objeto que CONTIENE la palabra sin serla.
 */
const FUERA_DEL_VOCABULARIO = ['abierto', 'EN_CURSO', '', null, undefined, 1, { estado: 'ABIERTO' }]

describe('aEstadoScan', () => {
  it.each(ESTADOS_SCAN)('conserva %s, que esta en el vocabulario', (estado) => {
    expect(aEstadoScan(estado)).toBe(estado)
  })

  // El lado seguro es CERRADO por lo mismo que es el default de la migracion:
  // una fila que no se sabe leer NO puede quedar en curso para siempre.
  it.each(FUERA_DEL_VOCABULARIO)('%s cae a CERRADO', (valor) => {
    expect(aEstadoScan(valor)).toBe('CERRADO')
  })

  it('no adivina por parecido: un score provisional se afirma, no se infiere', () => {
    expect(aEstadoScan('ABIERT')).toBe('CERRADO')
    expect(aEstadoScan('ABIERTOO')).toBe('CERRADO')
    expect(aEstadoScan(' ABIERTO ')).toBe('CERRADO')
  })
})
