import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLoopBudget } from '@domain/settings/loop-budget'

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

/**
 * ADR-107 retiro el LOOP y conservo lo que el DRENAJE usa. Tres hechos que, si
 * se rompen, rompen el drenaje de FORTRESS sin que nada mas se entere.
 */
describe('la cura conserva lo que el Drenaje usa (ADR-107)', () => {
  it('el LOOP ya no se relanza al arrancar la app', () => {
    const main = fuente('src/main/index.ts')

    expect(main).not.toContain('resumeLoops')
    expect(main).not.toContain('bindLoopWindow')
  })

  it('el Drenaje sigue leyendo sus DOS frenos duros (en el helper compartido)', () => {
    // Los frenos viven en UN solo sitio (`drenaje-deps`) que el handler Y el runner
    // headless llaman: una sola fuente para que ningun disparador se salte uno.
    const deps = fuente('src/infrastructure/repair/drenaje-deps.ts')
    expect(deps).toContain('readLoopBudget')
    expect(deps).toContain('budget.maxCycles')
    expect(deps).toContain('budget.costCapUsd')
    expect(fuente('src/infrastructure/ipc/repair-drain-handler.ts')).toContain('construirDepsDelDrenaje') // prettier-ignore
  })

  /**
   * SIN default a proposito: «nadie decide por el operador cuanto esta dispuesto
   * a gastar». Sin fijar salen 0, y el drenaje corta en la primera vuelta en vez
   * de gastar a ciegas.
   */
  it('los dos frenos duros no traen valor por defecto', () => {
    const sinFijar = parseLoopBudget(null, null, null, null, null, null)

    expect(sinFijar.costCapUsd).toBe(0)
    expect(sinFijar.maxCycles).toBe(0)
  })

  it('la seccion de Configuracion muestra SOLO los dos frenos duros', () => {
    const seccion = fuente('src/presentation/components/settings/TopesDelMotorSection.tsx')

    expect(seccion).toContain('SETTINGS_KEYS.loopCostCap')
    expect(seccion).toContain('SETTINGS_KEYS.loopMaxCycles')
    for (const valvula of ['loopMaxDenials', 'loopRescanEvery', 'loopMaxNoCandidates'])
      expect(seccion).not.toContain(valvula)
  })

  it('la historia se conserva: el repositorio de sesiones sigue en pie', () => {
    expect(fuente('src/domain/loop/loop-session.ts')).toContain('LoopSession')
    expect(fuente('src/infrastructure/persistence/sqlite-loop-session-repository.ts')).toContain('loop_sessions') // prettier-ignore
  })
})
