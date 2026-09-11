import { describe, expect, it } from 'vitest'
import { notasDelInforme } from './notas-del-informe'
import { parseScanOutput } from './parse-scan-output'

const HALLAZGO =
  '{"severity":"HIGH","title":"clave en el repo","file":"a.ts","line":4,"tipo":"secreto-versionado","simbolo":"K"}' // prettier-ignore
const NOTA = '{"kind":"limitacion","area":"consulta-del-grafo","note":"no pude trazar el simbolo"}'

const informe = (extra: string): string => `He revisado el modulo.

\`\`\`json
{"findings":[${HALLAZGO}]${extra}}
\`\`\``

describe('el informe del escaner lleva hallazgos Y notas en el MISMO bloque', () => {
  it('los hallazgos se leen igual que siempre, con o sin notas', () => {
    const conNotas = parseScanOutput(informe(`,"notes":[${NOTA}]`))
    const sinNotas = parseScanOutput(informe(''))

    expect(conNotas.ok && conNotas.value).toHaveLength(1)
    expect(sinNotas.ok && sinNotas.value).toEqual(conNotas.ok && conNotas.value)
  })

  it('y la nota sale del mismo bloque, sin segunda regex', () => {
    expect(notasDelInforme(informe(`,"notes":[${NOTA}]`))).toEqual([
      { kind: 'limitacion', area: 'consulta-del-grafo', note: 'no pude trazar el simbolo' }
    ])
  })

  it('sin notas no hay notas, y eso NO es un error del informe', () => {
    expect(notasDelInforme(informe(''))).toEqual([])
    expect(parseScanOutput(informe('')).ok).toBe(true)
  })

  it('un informe ilegible no da notas ni lanza', () => {
    expect(notasDelInforme('el agente se fue por las ramas')).toEqual([])
    expect(() => notasDelInforme('```json\n{roto\n```')).not.toThrow()
  })

  it('gana el ULTIMO bloque, como los hallazgos: el agente puede citar json antes', () => {
    const conCita = `Ejemplo:\n\`\`\`json\n{"notes":[{"kind":"bug","area":"otro","note":"citado"}]}\n\`\`\`\n${informe(`,"notes":[${NOTA}]`)}` // prettier-ignore

    expect(notasDelInforme(conCita)).toEqual([
      { kind: 'limitacion', area: 'consulta-del-grafo', note: 'no pude trazar el simbolo' }
    ])
  })
})
