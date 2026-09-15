import { describe, expect, it } from 'vitest'
import { DESENLACES_DE_VERIFICACION, notaDeVerificacion } from './dictamen-de-verificacion'

const QUE_SIGUEN_MITIGADOS = DESENLACES_DE_VERIFICACION.filter((d) => d !== 'extinguido')

describe('el aviso de una verificacion nombra al autor real (ADR-088)', () => {
  it('un cierre del Terminal NO dice que lo pidio el operador', () => {
    // El operador no pidio nada: el acto que dispara la verificacion es un
    // turno del Terminal. Atribuirselo seria falsear quien hizo que.
    for (const desenlace of QUE_SIGUEN_MITIGADOS) {
      const nota = notaDeVerificacion(desenlace, 'detalle', 'terminal')
      expect(nota).not.toContain('operador')
      expect(nota).toContain('Terminal')
    }
  })

  it('sin quien, el texto del operador queda byte a byte como estaba', () => {
    expect(notaDeVerificacion('sin_prueba', 'x')).toBe(
      'verificado a peticion del operador: el analista lo dio por obsoleto pero no pudo ' +
        'probarlo en el fichero, asi que el hallazgo NO se cierra — x'
    )
    expect(notaDeVerificacion('sigue_vivo', 'x')).toBe(
      'verificado a peticion del operador: el analista dice que el problema SIGUE en el ' +
        'codigo. El arreglo no lo cerro — x'
    )
  })

  it('el autor cambia el prefijo, no lo que dictamino el analista', () => {
    for (const desenlace of QUE_SIGUEN_MITIGADOS) {
      const cola = (quien: 'operador' | 'terminal'): string =>
        notaDeVerificacion(desenlace, 'd', quien).split(': ').slice(1).join(': ')
      expect(cola('terminal')).toBe(cola('operador'))
    }
  })
})
