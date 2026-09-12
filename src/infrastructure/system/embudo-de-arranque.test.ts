import { describe, expect, it } from 'vitest'
import { EVENTOS_DEL_EMBUDO, instalarEmbudoDeArranque } from './embudo-de-arranque'
import { banco, emisorFalso } from './embudo-fixture'

describe('el embudo del proceso principal (ADR-086, embudo 1)', () => {
  it('ASIENTA EL FALLO DE ARRANQUE con su clase, que hoy no deja rastro ninguno', () => {
    const b = banco()
    const e = emisorFalso()
    instalarEmbudoDeArranque(e.emisor, b.sumidero)

    e.disparar('uncaughtException', new TypeError('x'))

    expect(b.notas).toEqual([
      { kind: 'bug', area: 'fallo-de-arranque', note: 'FORTRESS rompio durante una excepcion sin capturar: TypeError' } // prettier-ignore
    ])
  })

  it('SOLO LO INESPERADO: se engancha a esos dos eventos y a ningun otro', () => {
    // Los 156 `err()` no pasan por aqui, y no deben: son valores que alguien
    // maneja —la app funcionando— y capturarlos llenaria el backlog de uso
    // normal. La prueba de que no se capturan es que no hay por donde entren.
    const e = emisorFalso()
    instalarEmbudoDeArranque(e.emisor, banco().sumidero)

    expect(e.eventos).toEqual([...EVENTOS_DEL_EMBUDO])
    expect(EVENTOS_DEL_EMBUDO).toEqual(['uncaughtException', 'unhandledRejection'])
  })

  it('LAS DOS LECTURAS: el error entero al log local, y nunca a la observacion', () => {
    const b = banco()
    const e = emisorFalso()
    const error = new Error('no pude abrir /media/cliente/ACME/db.sqlite')
    instalarEmbudoDeArranque(e.emisor, b.sumidero)

    e.disparar('unhandledRejection', error)

    expect(b.log[0].error).toBe(error)
    expect(b.notas[0].note).not.toContain('/media/')
    expect(b.notas[0].note).toBe('FORTRESS rompio durante una promesa rechazada sin manejar: Error')
  })
})
