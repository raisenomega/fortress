import { describe, expect, it } from 'vitest'
import { banco } from './lo-ya-atendido-fixture'
import { loYaAtendido } from './lo-ya-atendido'

describe('lo ya atendido, para que el analista no lo re-reporte', () => {
  it('lo atendido va como tema: area y nota, sin motivo', () => {
    const { ctx } = banco([{ area: 'grafo', note: 'auto-indexa sin permiso', reason: 'arreglado' }])

    expect(loYaAtendido(ctx)).toEqual(['grafo — auto-indexa sin permiso'])
  })

  it('lo descartado LLEVA su motivo: el defecto sigue ahi y sin la razon se reabre', () => {
    const { ctx } = banco([
      { area: 'ui', note: 'falta un boton', status: 'descartado', reason: 'no aplica desde el rediseno' } // prettier-ignore
    ])

    expect(loYaAtendido(ctx)).toEqual(['ui — falta un boton (descartado: no aplica desde el rediseno)']) // prettier-ignore
  })

  it('un descarte sin motivo lo DICE, no lo calla', () => {
    const { ctx } = banco([{ area: 'ui', note: 'n', status: 'descartado', reason: null }])

    expect(loYaAtendido(ctx)).toEqual(['ui — n (descartado: sin motivo escrito)'])
  })

  it('sin cerradas devuelve vacio, no una seccion sin nada debajo', () => {
    expect(loYaAtendido(banco([]).ctx)).toEqual([])
  })

  it('pide las 40 mas recientes, y el tope lo aplica la base', () => {
    const b = banco(Array.from({ length: 60 }, (_, i) => ({ note: `n${i}` })))

    expect(loYaAtendido(b.ctx)).toHaveLength(40)
    expect(b.tope()).toBe(40)
  })
})
