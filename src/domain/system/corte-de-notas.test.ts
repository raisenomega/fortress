import { describe, expect, it } from 'vitest'
import { antesDeNotas } from './corte-de-notas'
import { notasDeBloque } from './extraer-notas'

const CON_BLOQUE =
  'el plan visible NOTAS: [{"kind":"gap","area":"x","note":"reservada"}] :END-NOTAS'

describe('el corte del bloque NOTAS en el texto EN VIVO', () => {
  it('corta en cuanto el marcador asoma: el bloque no llega al operador ni a medias', () => {
    expect(antesDeNotas(CON_BLOQUE)).toBe('el plan visible ')
    expect(antesDeNotas('plan y luego NOTAS: [{"a"')).toBe('plan y luego ')
  })

  it('sin marcador, el texto pasa entero', () => {
    const texto = 'un plan normal sin bloque'
    expect(antesDeNotas(texto)).toBe(texto)
  })

  it('COHERENCIA con extraer-notas: donde hay bloque que extraer, aqui se corta', () => {
    // Si el marcador de BLOQUE cambiara alli y no aqui, este test se pone rojo.
    expect(notasDeBloque(CON_BLOQUE).length).toBeGreaterThan(0)
    expect(antesDeNotas(CON_BLOQUE)).not.toContain('reservada')
  })
})
