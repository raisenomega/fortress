import { describe, expect, it } from 'vitest'
import { parseScanOutput } from './parse-scan-output'

const report = (body: string): string => `Analisis del proyecto.\n\n\`\`\`json\n${body}\n\`\`\``

describe('una lista de la que no sobrevive NADA es un informe ilegible', () => {
  it('falla cuando todas las entradas se caen por el titulo', () => {
    // Esto devolvia ok([]) y el tablero pintaba 100/100 «proyecto limpio» sobre
    // un informe que no se entendio. Era la peor mentira que podia contar la app,
    // y el docblock del parser existia precisamente para prohibirla.
    const r = parseScanOutput(report('{"findings":[{"severity":"HIGH","title":"  "},{"severity":"LOW","title":""}]}')) // prettier-ignore
    expect(r.ok).toBe(false)
  })

  it('falla cuando ninguna entrada es un objeto', () => {
    expect(parseScanOutput(report('{"findings":["texto suelto","otro"]}')).ok).toBe(false)
  })

  it('falla con una sola entrada que no se entiende', () => {
    expect(parseScanOutput(report('{"findings":[{"severity":"URGENTE","title":"x"}]}')).ok).toBe(false)
  })

  it('el proyecto limpio de VERDAD sigue siendo valido: la lista vacia declarada', () => {
    // Toda la diferencia esta aqui. Cero entradas es el modelo diciendo «no
    // encontre nada»; entradas que no se entienden es el modelo sin decir nada.
    const r = parseScanOutput(report('{"findings":[]}'))
    expect(r.ok && r.value).toEqual([])
  })

  it('una sola entrada buena entre basura sigue dando informe', () => {
    const r = parseScanOutput(report('{"findings":["x",{"severity":"MEDIUM","title":"valido"},{}]}'))
    expect(r.ok && r.value).toHaveLength(1)
  })
})
