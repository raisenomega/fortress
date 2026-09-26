import { describe, expect, it } from 'vitest'
import { correrLote } from './cola-del-lote'
import { banco } from './cola-del-lote-fixture'

const IDS = ['f1', 'f2', 'f3']
const BARRERA = { puerta: 'barrera', motivo: 'La barrera no puede arrancar.' } as const

describe('una puerta que niega CORTA el lote, y el parte lo dice', () => {
  // La barrera es del PROYECTO, no del hallazgo: si nego uno, negara a todos.
  // Seguir probando solo repite el mismo no — y en otras puertas, lo cobra.
  it('negado a la primera: no se lanza ninguno mas', async () => {
    const b = banco({ niega: () => BARRERA })
    expect(await correrLote('p1', IDS, b.p)).toEqual(['negado'])
    expect(b.enviados.map((i) => i.findingId)).toEqual(['f1'])
  })

  it('el parte que se PERSISTE lleva el motivo: sobrevive a cerrar la app', async () => {
    const b = banco({ niega: () => BARRERA })
    await correrLote('p1', IDS, b.p)
    expect(b.resumenes).toHaveLength(1)
    expect(b.resumenes[0]).toContain('NEGADO por la barrera del proyecto')
    expect(b.resumenes[0]).toContain('La barrera no puede arrancar.')
    expect(b.resumenes[0]).toContain('Cortado: 3 sin lanzar.')
    expect(b.resumenes[0]).not.toContain('3 no cerraron')
  })

  it('un turno negado no recarga ni avanza: no hubo turno', async () => {
    const b = banco({ niega: () => BARRERA })
    await correrLote('p1', IDS, b.p)
    expect(b.log.join(' ')).toBe('arrancar enviar:f1 fin:f1 terminar')
  })

  it('negado a mitad: lo anterior se hizo y se cuenta', async () => {
    const b = banco({ niega: (id) => (id === 'f2' ? BARRERA : null) })
    expect(await correrLote('p1', IDS, b.p)).toEqual(['no_cerro', 'negado'])
    expect(b.enviados.map((i) => i.findingId)).toEqual(['f1', 'f2'])
    expect(b.resumenes[0]).toContain('Lote: 1 de 3 procesados')
  })

  it('un turno que NO cierra sigue sin cortar nada: eso no es una negativa', async () => {
    const b = banco()
    expect(await correrLote('p1', IDS, b.p)).toEqual(['no_cerro', 'no_cerro', 'no_cerro'])
    expect(b.resumenes[0]).not.toContain('NEGADO')
  })
})
