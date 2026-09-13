import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verificarTodos } from './verificar-todos'
import { banco, deps, mitigado, verificador } from './verificar-todos-fixture'

afterEach(() => vi.restoreAllMocks())

const lista = (n: number): ReturnType<typeof mitigado>[] =>
  Array.from({ length: n }, (_, i) => mitigado(`f${i}`))

describe('la lista se fija al arrancar', () => {
  it('recorre los cinco y ni uno mas: la lista no se re-pregunta', async () => {
    const espia = verificador('sin_prueba', 'sin_prueba', 'sin_prueba', 'sin_prueba', 'sin_prueba')

    const parte = await verificarTodos(banco(lista(5)), 'p1', deps())

    // Si re-preguntara, estos cinco seguirian MITIGADOS tras verificarse y
    // volverian a salir elegidos: el barrido no terminaria nunca.
    expect(espia).toHaveBeenCalledTimes(5)
    expect(parte).toMatchObject({ fin: 'completado', total: 5, sinPrueba: 5 })
  })

  it('atiende a cada uno UNA vez, aunque todos sigan mitigados al terminar', async () => {
    const espia = verificador('sin_prueba', 'sin_prueba', 'sin_prueba')

    await verificarTodos(banco(lista(3)), 'p1', deps())

    const atendidos = espia.mock.calls.map((c) => c[2])
    expect(atendidos).toEqual(['f0', 'f1', 'f2'])
  })
})

describe('dentro del bucle no hay mas freno que Detener', () => {
  it('con 26 mitigados verifica 26, no 25: pedir todos no puede devolver casi todos', async () => {
    const espia = verificador(...Array.from({ length: 26 }, () => 'extinguido'))

    const parte = await verificarTodos(banco(lista(26)), 'p1', deps())

    expect(espia).toHaveBeenCalledTimes(26)
    expect(parte).toMatchObject({ fin: 'completado', total: 26, extinguidos: 26 })
  })

  it('el fuente no nombra ningun tope: la ausencia es la decision, no un olvido', () => {
    const fuente = readFileSync(join(process.cwd(), 'src/application/repair/verificar-todos.ts'), 'utf8') // prettier-ignore

    expect(fuente).not.toMatch(/\b(maxVueltas|costCapUsd|topeDiario|gastado)\b/)
    // Y lo unico que se le pide a `deps` dentro del bucle son esas dos cosas.
    expect([...fuente.matchAll(/deps\.(\w+)/g)].map((m) => m[1])).toEqual([
      'cancelado',
      'cancelado',
      'avisar'
    ])
  })
})
