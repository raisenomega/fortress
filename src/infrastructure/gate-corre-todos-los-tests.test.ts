import { readdirSync, statSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../../vitest.config'

/**
 * ADR-115 A4. Hasta el 2026-10-05 el `include` era `src/**\/*.test.ts` y los
 * `.test.tsx` no corrian NUNCA: 7 ficheros, 11 tests, todos escritos por el
 * propio Motor para sus arreglos de UI (la correa le da `<ancla>.test.tsx`), y
 * su gate usa esta misma config. Se deriva del disco, sin lista a mano: un test
 * que el gate no recoge es peor que ninguno, porque da confianza falsa.
 */
function testsDe(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return testsDe(ruta)
    return /\.test\.tsx?$/.test(e) ? [ruta] : []
  })
}

const include = config.test?.include ?? []
const todos = testsDe('src')
const fuera = todos.filter((f) => !include.some((g) => matchesGlob(f, g)))

describe('el gate recoge TODOS los ficheros de test de src/', () => {
  it('hay tests .tsx en el arbol (si no, este test no mediria nada)', () => {
    expect(todos.filter((f) => f.endsWith('.tsx')).length).toBeGreaterThanOrEqual(7)
  })

  it('ninguno queda fuera del include', () => {
    expect(fuera).toEqual([])
  })
})
