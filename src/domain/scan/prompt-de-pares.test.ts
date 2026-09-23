import { describe, expect, it } from 'vitest'
import { promptDePares } from './prompt-de-pares'

// prettier-ignore
const PAR = { id: 'a+b', a: { file: 'f/index.ts', line: 258, tipo: 'rate-limit-ausente', simbolo: 'handler', title: 'sin tope' }, b: { file: 'f/index.ts', line: 268, tipo: 'rate-limit-ausente', simbolo: 'handler', title: 'la unica sin rate limit' } }

describe('promptDePares: MISMO solo con certeza, DISTINTOS por defecto', () => {
  it('lista cada par con sus dos filas y pide MISMO|DISTINTOS con razon, fail-closed a DISTINTOS', () => {
    const p = promptDePares([PAR])
    expect(p).toContain('"par": "a+b"')
    expect(p).toContain('f/index.ts:258')
    expect(p).toContain('f/index.ts:268')
    expect(p).toMatch(/si no estas seguro, "DISTINTOS"/)
    expect(p).toContain('{"pares":[{"par":"…","veredicto":"MISMO|DISTINTOS","razon":"…"}]}')
  })
})
