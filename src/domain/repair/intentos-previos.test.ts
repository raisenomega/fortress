import { describe, expect, it } from 'vitest'
import { intentosPrevios } from './intentos-previos'

describe('lo que ya se intento con este hallazgo', () => {
  it('sin intentos no dice nada: no hay pista que dar', () => {
    expect(intentosPrevios(0, 0)).toBeNull()
  })

  it('un integrado (GIT-confirmado) manda mirar si el defecto sigue ahi ANTES que nada', () => {
    const linea = intentosPrevios(2, 1)

    expect(linea).toContain('2 propuesta(s)')
    expect(linea).toContain('1 confirmado(s) en git')
    expect(linea).toContain('comprueba si el defecto sigue ahi')
  })

  it('sin ninguna integrada lo DICE, en vez de callar el intento', () => {
    expect(intentosPrevios(2, 0)).toContain('git no confirma ninguno integrado')
  })

  it('siempre se declara PISTA, nunca veredicto', () => {
    // Un merge pudo arreglar otra cosa del mismo sitio, o arreglarlo a medias.
    for (const [total, integradas] of [
      [1, 1],
      [1, 0]
    ] as const) {
      expect(intentosPrevios(total, integradas)).toContain('lo que decide sigue siendo el fichero')
    }
  })
})
