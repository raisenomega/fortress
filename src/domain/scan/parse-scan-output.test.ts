import { describe, expect, it } from 'vitest'
import { parseScanOutput } from './parse-scan-output'

const report = (body: string): string => `Analisis del proyecto.\n\n\`\`\`json\n${body}\n\`\`\``

describe('parseScanOutput', () => {
  it('extrae los hallazgos del bloque JSON', () => {
    const result = parseScanOutput(
      report(
        '{"findings":[{"severity":"CRITICAL","title":"Secret","file":"a.js","line":3,"tipo":"secret-in-env","simbolo":"buildEnv"}]}'
      )
    )
    expect(result.ok && result.value).toEqual([
      { severity: 'CRITICAL', title: 'Secret', file: 'a.js', line: 3, tipo: 'secret-in-env', simbolo: 'buildEnv' } // prettier-ignore
    ])
  })

  it('acepta un proyecto limpio como resultado valido', () => {
    const result = parseScanOutput(report('{"findings":[]}'))
    expect(result.ok && result.value).toEqual([])
  })

  it('se queda con el ultimo bloque, no con un ejemplo citado antes', () => {
    const output = `${report('{"findings":[{"severity":"LOW","title":"viejo"}]}')}
${report('{"findings":[{"severity":"HIGH","title":"nuevo","file":"b.ts","line":9}]}')}`
    const result = parseScanOutput(output)
    expect(result.ok && result.value[0].title).toBe('nuevo')
  })

  it('normaliza campos ausentes o mal tipados del hallazgo', () => {
    const result = parseScanOutput(
      report('{"findings":[{"severity":"LOW","title":"x","line":"7"}]}')
    )
    expect(result.ok && result.value[0]).toEqual({
      severity: 'LOW',
      title: 'x',
      file: '',
      line: null,
      tipo: 'otro',
      simbolo: ''
    })
  })
})

describe('parseScanOutput ante informes rotos', () => {
  it('falla en vez de reportar limpio cuando no hay informe', () => {
    // Un informe ausente no es un proyecto sano: si esto devolviera [] la app
    // pintaria 100/100 sobre un escaneo que en realidad no dijo nada.
    expect(parseScanOutput('No encontre nada preocupante.').ok).toBe(false)
  })

  it('falla si el bloque no es JSON valido', () => {
    expect(parseScanOutput(report('{findings: [}')).ok).toBe(false)
  })

  it('falla si el JSON no trae la lista de hallazgos', () => {
    expect(parseScanOutput(report('{"resumen":"todo bien"}')).ok).toBe(false)
    expect(parseScanOutput(report('null')).ok).toBe(false)
  })

  it('descarta entradas invalidas sin tumbar el informe entero', () => {
    const result = parseScanOutput(
      report(`{"findings":[
        {"severity":"URGENTE","title":"severidad inventada"},
        {"severity":"HIGH","title":"   "},
        {"severity":"HIGH"},
        "texto suelto",
        {"severity":"MEDIUM","title":"valido","file":"c.py","line":2}
      ]}`)
    )
    expect(result.ok && result.value).toHaveLength(1)
    expect(result.ok && result.value[0].title).toBe('valido')
  })
})
