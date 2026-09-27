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
    // Con una entrada buena al lado, para medir el DESCARTE de la inventada y no
    // el desenlace del informe entero: una lista sin supervivientes es ilegible.
    const result = parseScanOutput(
      report('{"findings":[{"severity":"urgente","title":"a"},{"severity":"LOW","title":"b"}]}')
    )
    expect(result.ok && result.value).toHaveLength(1)
    expect(result.ok && result.value[0].title).toBe('b')
  })
})
