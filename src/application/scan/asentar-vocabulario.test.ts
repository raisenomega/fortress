import { describe, expect, it } from 'vitest'
import { asentarVocabulario } from './asentar-vocabulario'
import { contexto, hallazgo, PROJECT } from './asentar-vocabulario-fixture'

describe('asentarVocabulario: cuanto no se supo clasificar, en el Libro', () => {
  it('con otros: un asiento nota/info del escaner, con el porcentaje', () => {
    const { context, asientos } = contexto()

    asentarVocabulario(context, PROJECT, [hallazgo('otro'), hallazgo('cors-permisivo', 'g.ts')])

    expect(asientos).toHaveLength(1)
    expect(asientos[0]).toMatchObject({ projectId: 'p1', agentId: 'security-reviewer', kind: 'nota', verdict: 'info' }) // prettier-ignore
    expect(asientos[0].summary).toContain('1 de 2 hallazgos cayeron a "otro" (50%)')
  })

  it('por encima del umbral lo dice, y sigue siendo info y no discrepancia', () => {
    const { context, asientos } = contexto()

    asentarVocabulario(context, PROJECT, [hallazgo('otro'), hallazgo('otro', 'g.ts')])

    // Que al vocabulario le falte un tipo no es una mentira del escaner.
    expect(asientos[0].verdict).toBe('info')
    expect(asientos[0].summary).toContain('supera el 15%')
  })

  it('dentro del umbral tambien se asienta, pero sin acusar al vocabulario', () => {
    const { context, asientos } = contexto()
    const limpios = Array.from({ length: 19 }, (_, i) => hallazgo('cors-permisivo', `f${i}.ts`))

    asentarVocabulario(context, PROJECT, [hallazgo('otro'), ...limpios])

    expect(asientos[0].summary).toContain('dentro del umbral')
    expect(asientos[0].summary).not.toContain('supera')
  })

  it('sin ningun otro no se asienta nada', () => {
    const { context, asientos } = contexto()

    asentarVocabulario(context, PROJECT, [hallazgo('rate-limit-ausente')])

    expect(asientos).toEqual([])
  })
})

describe('asentarVocabulario: la evidencia y el mejor esfuerzo', () => {
  it('la evidencia nombra los sitios que cayeron a otro', () => {
    const { context, asientos } = contexto()

    asentarVocabulario(context, PROJECT, [hallazgo('otro'), hallazgo('otro', 'g.ts', null)])

    expect(asientos[0].evidence).toBe('f.ts:1; g.ts')
  })

  it('si el Libro falla, el escaneo no', () => {
    const { context } = contexto(true)
    expect(() => asentarVocabulario(context, PROJECT, [hallazgo('otro')])).not.toThrow()
  })
})
