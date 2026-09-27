import { describe, expect, it } from 'vitest'
import { parseScanOutput } from './parse-scan-output'

const report = (body: string): string => `Analisis del proyecto.\n\n\`\`\`json\n${body}\n\`\`\``

describe('el parser tolera la CAJA de la severidad que escribe el modelo', () => {
  it('lee el informe aunque venga en minuscula', () => {
    // Un `high` en vez de `HIGH` era un hallazgo REAL descartado en silencio, y
    // con todas las entradas asi el informe entero pasaba por proyecto limpio.
    const result = parseScanOutput(
      report('{"findings":[{"severity":"critical","title":"a"},{"severity":"high","title":"b"}]}')
    )
    expect(result.ok && result.value).toHaveLength(2)
    expect(result.ok && result.value[0].severity).toBe('CRITICAL')
    expect(result.ok && result.value[1].severity).toBe('HIGH')
  })

  it('lee el informe con la severidad capitalizada', () => {
    const result = parseScanOutput(report('{"findings":[{"severity":"Medium","title":"a"}]}'))
    expect(result.ok && result.value[0].severity).toBe('MEDIUM')
  })

  it('sigue descartando una severidad que no esta en la escala', () => {
    const result = parseScanOutput(report('{"findings":[{"severity":"urgente","title":"a"}]}'))
    expect(result.ok && result.value).toHaveLength(0)
  })
})
