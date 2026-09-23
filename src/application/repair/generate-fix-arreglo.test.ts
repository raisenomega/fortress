import { describe, expect, it } from 'vitest'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

const MOTIVO = 'arreglo_fuera_de_correa: src/infra/x.ts cfg=abcd1234'

describe('el guard del arreglo: no se paga por generar lo que no cabe (ADR-102 §3)', () => {
  it('arreglo fuera de la correa: RECHAZADO ANTES del generador, worktree limpiado, motivo con cfg', async () => {
    const b = bench({ arreglo: { file: 'src/infra/x.ts', line: 3 }, huella: 'abcd1234' })
    const r = await generateFix(b.context, 'prop-1', b.deps)

    expect(r).toMatchObject({ ok: false, reason: 'arreglo_fuera_de_correa' })
    expect(b.calls).toEqual(['create', 'remove'])
    expect(b.prompts).toEqual([])
    expect(b.patches.at(-1)).toMatchObject({ state: 'RECHAZADO', analysisReason: MOTIVO })
    const salida = b.events.find((e) => e.eventType === 'TRANSITION')
    expect(salida?.reason).toBe(MOTIVO)
    expect(JSON.parse(salida?.evidenceJson ?? '{}')).toMatchObject({
      arreglo: { file: 'src/infra/x.ts', line: 3 },
      allowed: ['src/a/b.ts', 'src/a/b.test.ts', 'src/a/b.spec.ts'],
      allows: [],
      cfg: 'abcd1234'
    })
  })

  it('arreglo dentro de la correa: genera, y la correa del prompt es la de siempre', async () => {
    const b = bench({ arreglo: { file: 'src/a/b.ts', line: 1 } })
    expect((await generateFix(b.context, 'prop-1', b.deps)).ok).toBe(true)
    expect(b.calls).toContain('generate')
    expect(b.prompts[0]).toContain('- src/a/b.ts\n')
    expect(b.prompts[0]).not.toContain('src/infra')
  })

  it('arreglo en el terreno que el proyecto declaro: genera, la correa no se ensancha', async () => {
    const grupo = { name: 'infra', when: 'src/a/**', allow: ['src/infra/**'] }
    const b = bench({ arreglo: { file: 'src/infra/x.ts', line: 3 }, scopeGroups: [grupo] })
    expect((await generateFix(b.context, 'prop-1', b.deps)).ok).toBe(true)
    expect(b.calls).toContain('generate')
    expect(b.prompts[0]).not.toContain('- src/infra/x.ts')
  })

  it('sin arreglo declarado: se genera como hoy y el Libro lo cuenta (casilla 1)', async () => {
    const b = bench({ sinArreglo: true })
    expect((await generateFix(b.context, 'prop-1', b.deps)).ok).toBe(true)
    expect(b.calls).toContain('generate')
    const cuenta = b.events.filter((e) => e.eventType === 'DECISION' && e.reason === 'ARREGLO_SIN_DECLARAR') // prettier-ignore
    expect(cuenta).toHaveLength(1)
  })
})
