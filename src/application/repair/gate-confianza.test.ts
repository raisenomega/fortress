import { describe, expect, it } from 'vitest'
import { ejecutaConConfianza } from '@domain/repair/confianza'
import type { Project } from '@domain/project/project'
import { runGate } from './run-gate'
import { bench, cmd } from './run-gate-fixture'

const proyecto = (trusted: boolean): Project => ({ id: 'p1', trusted }) as Project

describe('el gate no ejecuta codigo de un repo en el que no se confia', () => {
  it('sin confianza: RECHAZADO y el runner no llega a correr', async () => {
    const b = bench({ trusted: false })
    let corrio = false
    const deps = { ...b.deps, runner: { run: () => { corrio = true; return Promise.resolve({ ok: true as const, commands: [cmd('npm ci')] }) } } } // prettier-ignore

    const salida = await runGate(b.context, 'prop-1', deps)

    expect(salida).toEqual({ ok: false, reason: 'proyecto_sin_confianza' })
    expect(corrio).toBe(false)
    expect(b.patches.at(-1)).toMatchObject({ state: 'RECHAZADO' })
  })

  it('la razon queda citable en el libro, no como texto suelto', async () => {
    const b = bench({ trusted: false })
    await runGate(b.context, 'prop-1', b.deps)
    expect(b.patches.at(-1)?.analysisReason).toBe('proyecto_sin_confianza')
    expect(b.events.at(-1)).toMatchObject({ toState: 'RECHAZADO' })
  })

  it('no-regresion: con confianza el gate corre y llega a verde', async () => {
    const b = bench({ trusted: true })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: true })
    expect(b.patches.at(-1)).toMatchObject({ state: 'GATE' })
  })

  it('por defecto los proyectos del banco son de confianza, como los reales', async () => {
    expect(await runGate(bench().context, 'prop-1', bench().deps)).toEqual({ ok: true })
  })

  it('el predicado: sin proyecto tampoco se ejecuta', () => {
    expect(ejecutaConConfianza(proyecto(true))).toBe(true)
    expect(ejecutaConConfianza(proyecto(false))).toBe(false)
    expect(ejecutaConConfianza(null)).toBe(false)
    expect(ejecutaConConfianza(undefined)).toBe(false)
  })
})
