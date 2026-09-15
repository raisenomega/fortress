import { describe, expect, it } from 'vitest'
import { notaDelCierre, parteDelCierre, pendienteDeVerificar } from './cierre-del-ciclo'

describe('la nota del mitigado cita el turno y los ficheros, nunca un sha', () => {
  it('rutas relativas a la raiz, sin repetir, en el orden en que se tocaron', () => {
    const edits = ['/r/p/src/b.ts', '/r/p/src/a.ts', '/r/p/src/b.ts', '/fuera/x.ts']

    expect(notaDelCierre('m-9', edits, '/r/p')).toBe(
      'arreglado por el Terminal · turno m-9 · ficheros: src/b.ts, src/a.ts, /fuera/x.ts'
    )
  })

  it('una raiz que es prefijo de otra no recorta de mas', () => {
    expect(notaDelCierre('m', ['/r/pp/a.ts'], '/r/p')).toContain('ficheros: /r/pp/a.ts')
  })
})

describe('lo que no llego a dictamen se dice, en la fila y en el turno', () => {
  it('la fila: pendiente de verificar, con el motivo, y que NO esta verificado', () => {
    const nota = pendienteDeVerificar('el CLI no arranca')

    expect(nota).toMatch(/^pendiente de verificar: /)
    expect(nota).toContain('el CLI no arranca')
    expect(nota).toContain('NO esta verificado')
  })

  it('el turno: un pendiente nunca habla de Historia; un extinguido si', () => {
    const pendiente = parteDelCierre({ desenlace: 'pendiente', motivo: 'boom' })
    expect(pendiente).toContain('PENDIENTE de verificar')
    expect(pendiente).not.toContain('Historia')

    expect(parteDelCierre({ desenlace: 'extinguido' })).toContain('pasa a Historia')
  })

  it('sin prueba y sigue vivo dicen que NO se cerro', () => {
    expect(parteDelCierre({ desenlace: 'sin_prueba' })).toContain('NO se cierra')
    expect(parteDelCierre({ desenlace: 'sigue_vivo' })).toContain('SIGUE')
  })
})
