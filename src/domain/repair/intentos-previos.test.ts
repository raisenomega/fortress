import { describe, expect, it } from 'vitest'
import { intentosPrevios } from './intentos-previos'
import type { Proposal } from './proposal'

const p = (state: Proposal['state']): Proposal => ({ state }) as Proposal

describe('lo que ya se intento con este hallazgo', () => {
  it('sin intentos no dice nada: no hay pista que dar', () => {
    expect(intentosPrevios([])).toBeNull()
  })

  it('un MERGEADO manda mirar si el defecto sigue ahi ANTES que nada', () => {
    // Tres agentes reconstruyeron este rastro a mano leyendo mensajes de commit.
    const linea = intentosPrevios([p('RECHAZADO'), p('MERGEADO')])

    expect(linea).toContain('2 propuesta(s)')
    expect(linea).toContain('1 llegaron a MERGEADO')
    expect(linea).toContain('comprueba si el defecto sigue ahi')
  })

  it('sin ninguna integrada lo DICE, en vez de callar el intento', () => {
    expect(intentosPrevios([p('RECHAZADO'), p('CADUCADO')])).toContain('ninguno llego a integrarse') // prettier-ignore
  })

  it('siempre se declara PISTA, nunca veredicto', () => {
    // Un merge pudo arreglar otra cosa del mismo sitio, o arreglarlo a medias.
    for (const suyas of [[p('MERGEADO')], [p('RECHAZADO')]]) {
      expect(intentosPrevios(suyas)).toContain('lo que decide sigue siendo el fichero')
    }
  })
})
