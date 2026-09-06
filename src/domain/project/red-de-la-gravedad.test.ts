import { describe, expect, it } from 'vitest'
import { masUrgente, type Severity } from '../shared/severity'
import { supervivientesDegradadas, type Pareja } from './severidad-al-fundir'

const pareja = (id: string, viva: Severity, absorbida: Severity): Pareja => ({
  id,
  viva,
  absorbida
})
const degradadas = (...p: readonly Pareja[]): readonly { id: string; maxima: Severity }[] =>
  supervivientesDegradadas(p, masUrgente)

/**
 * La red (criterio 6). Se prueba AQUI y no en el script: alli solo queda la
 * consulta y el `throw`, porque `scripts/` esta fuera del gate y lo que puede
 * equivocarse tiene que correr dentro.
 */
describe('la red: supervivientes que quedaron por debajo de su grupo', () => {
  it('caza el caso del 24-ago: una MEDIUM que absorbio un HIGH', () => {
    expect(degradadas(pareja('vieja', 'MEDIUM', 'HIGH'))).toEqual([
      { id: 'vieja', viva: 'MEDIUM', maxima: 'HIGH' }
    ])
  })

  it('no protesta cuando la superviviente ya lleva la mas alta', () => {
    expect(degradadas(pareja('a', 'HIGH', 'MEDIUM'), pareja('a', 'HIGH', 'LOW'))).toEqual([])
  })

  it('junta las absorbidas de una misma superviviente antes de juzgar', () => {
    // Dos filas, un solo grupo: si se juzgaran por separado, la LOW no diria nada.
    const dos = degradadas(pareja('a', 'MEDIUM', 'LOW'), pareja('a', 'MEDIUM', 'CRITICAL'))

    expect(dos).toHaveLength(1)
    expect(dos[0].maxima).toBe('CRITICAL')
  })

  it('separa supervivientes distintas: una degradada no ensucia a la sana', () => {
    const varias = degradadas(pareja('mala', 'LOW', 'HIGH'), pareja('sana', 'HIGH', 'LOW'))

    expect(varias.map((d) => d.id)).toEqual(['mala'])
  })

  it('sin fusiones no hay nada que juzgar', () => {
    expect(degradadas()).toEqual([])
  })
})
