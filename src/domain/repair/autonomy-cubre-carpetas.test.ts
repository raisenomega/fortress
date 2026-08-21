import { describe, expect, it } from 'vitest'
import { evaluate } from './auto-merge-evaluation'
import { DEFAULT_POLICY } from './auto-merge-policy'

const ACTIVA = { ...DEFAULT_POLICY, enabled: true }
const fix = (file: string): Parameters<typeof evaluate>[0] => ({
  severity: 'LOW', files: [file], insertions: 1, deletions: 0
}) // prettier-ignore

/** Proteger POR CARPETA donde la carpeta entera es la defensa. */
describe('posture se protege por carpeta, no por mitades', () => {
  it('un archivo NUEVO bajo posture nace protegido, sin tocar la lista', () => {
    // Es lo que el glob compra: la lista solo cubre lo que alguien recuerda
    // escribir, y enumerar mitades fallo cuatro veces. Un archivo que aun no
    // existe no puede estar en una lista de nombres, pero si bajo una carpeta.
    const nuevo = 'src/domain/posture/deteccion-que-aun-no-existe.ts'
    expect(evaluate(fix(nuevo), ACTIVA).conditionFailed).toBe('blacklist')
    expect(evaluate(fix('src/infrastructure/posture/otra-capa.ts'), ACTIVA).allowed).toBe(false)
  })

  it('el glob alcanza tambien las subcarpetas de posture', () => {
    expect(evaluate(fix('src/domain/posture/analyze/tls.ts'), ACTIVA).allowed).toBe(false)
  })
})
