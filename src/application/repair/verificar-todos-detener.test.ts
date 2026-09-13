import { afterEach, describe, expect, it, vi } from 'vitest'
import * as intento from './intento-de-verificacion'
import { verificarTodos } from './verificar-todos'
import { banco, deps, mitigado, verificador } from './verificar-todos-fixture'

afterEach(() => vi.restoreAllMocks())

const CINCO = ['f0', 'f1', 'f2', 'f3', 'f4'].map(mitigado)

/** Detener a partir de la vuelta numero `n`. */
const paraEn = (n: number): (() => boolean) => {
  let vueltas = 0
  return () => (vueltas += 1) > n
}

describe('una parada humana es una parada, no una averia', () => {
  it('detenido a mitad: fin detenido, y lo hecho queda contado', async () => {
    verificador('extinguido', 'extinguido', 'sigue_vivo')

    // La tercera consulta del boton ya dice basta: dos verificados y fuera.
    const parte = await verificarTodos(banco(CINCO), 'p1', deps({ cancelado: paraEn(2) }))

    expect(parte.fin).toBe('detenido')
    expect(parte).toMatchObject({ extinguidos: 2, total: 5 })
  })

  it('el analista muere PORQUE lo mataste: eso es detenido, nunca averia', async () => {
    // La secuencia REAL de Detener: la marca se pone mientras la verificacion
    // corre —matando a su hijo—, no antes de arrancarla. Por eso la guarda de
    // arriba del bucle no la ve, y hace falta volver a mirar el boton al recoger
    // el fallo: un hijo muerto a peticion del operador se parece a una maquina
    // rota, y sin esa relectura se reporta como averia.
    let parado = false
    vi.spyOn(intento, 'intentarVerificar').mockImplementation((_ctx, _pid, id) => {
      if (id === 'f0') return Promise.resolve({ ok: true, desenlace: 'extinguido' })
      parado = true
      return Promise.resolve({ ok: false, error: 'El analista no llego a terminar' })
    })

    const parte = await verificarTodos(banco(CINCO), 'p1', deps({ cancelado: () => parado }))

    expect(parte.fin).toBe('detenido')
    expect(parte.detalle).toBeUndefined()
  })

  it('pero un fallo SIN parada sigue siendo una averia, con su motivo', async () => {
    verificador('extinguido', new Error('el CLI no arranca'))

    const parte = await verificarTodos(banco(CINCO), 'p1', deps())

    expect(parte).toMatchObject({ fin: 'averia', detalle: 'el CLI no arranca', extinguidos: 1 })
  })
})

describe('lo verificado se cuenta ANTES de volver a mirar el boton', () => {
  it('el que estaba en curso no se pierde del parte: se cuenta y luego se para', async () => {
    verificador('extinguido', 'sigue_vivo')
    let hechos = 0

    const parte = await verificarTodos(
      banco(CINCO),
      'p1',
      deps({ cancelado: () => hechos >= 2, avisar: () => (hechos += 1) })
    )

    expect(parte).toMatchObject({ fin: 'detenido', extinguidos: 1, siguenVivos: 1 })
  })
})
