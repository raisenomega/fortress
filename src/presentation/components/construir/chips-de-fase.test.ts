import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chipsDelCto } from './chips-del-cto'

/** PASO 158: chips contexto·bloque (gris→verde) + aislamiento de vista + 152c. */

const fuente = (r: string): string => readFileSync(r, 'utf8')
const plan = fuente('src/presentation/services/escuchar-el-plan.ts')
const menu = fuente('src/presentation/components/construir/ConstruirModeMenu.tsx')
const runCto = fuente('src/infrastructure/build/run-cto.ts')

describe('chips del CTO: contexto·bloque', () => {
  it('sin fases, ambos pendientes; con fases, hechos (orden contexto, bloque)', () => {
    expect(chipsDelCto([]).map((c) => c.hecha)).toEqual([false, false])
    expect(chipsDelCto(['contexto']).map((c) => c.hecha)).toEqual([true, false])
    expect(chipsDelCto(['contexto', 'bloque']).map((c) => c.hecha)).toEqual([true, true])
    expect(chipsDelCto([]).map((c) => c.fase)).toEqual(['contexto', 'bloque'])
  })

  it('T1/T2 pin: run-cto teje las fases y emite contexto tras los marcos', () => {
    expect(runCto).toContain('tejerFasesDelCto')
    expect(runCto).toContain('.contexto()')
  })

  it('T3 (aislamiento): el CTO alimenta construir-store por chat-cto, NO run-meter-store', () => {
    expect(plan).toContain('onProgress')
    expect(plan).toContain('marcarFase')
    expect(plan).not.toContain('RunMeter')
  })

  it('T4 (152c): el hint del CTO en el menú ya no dice "· sin repo"', () => {
    expect(menu).not.toContain('· sin repo')
  })
})
