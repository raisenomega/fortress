import { describe, expect, it } from 'vitest'
import { redactarTranscript } from './redactar-transcript'

const bloque = (json: string): string => '```json\n' + json + '\n```'
const sacarBloques = (texto: string): string[] =>
  [...texto.matchAll(/```json\s*([\s\S]*?)```/g)].map((m) => m[1].trim())

describe('el transcript se tacha POR CAMPO, nunca el montado', () => {
  it('el secreto dentro de un campo se tacha y el bloque RE-PARSEA', () => {
    const texto =
      'Analisis con Bearer abc123token\n\n' +
      bloque('{"findings":[{"severity":"LOW","title":"pide token: abc123","file":"a.ts","line":3}]}')

    const tachado = redactarTranscript(texto)

    // La prosa se tacha como siempre.
    expect(tachado).not.toContain('Bearer abc123token')
    // El campo se tacha SIN comerse la estructura de al lado.
    const [json] = sacarBloques(tachado)
    const parsed = JSON.parse(json) as { findings: { title: string; line: number }[] }
    expect(parsed.findings[0].title).toContain('***')
    expect(parsed.findings[0].title).not.toContain('abc123')
    expect(parsed.findings[0].line).toBe(3)
  })

  it('varios bloques: todos re-parsean y la prosa entre medias sobrevive', () => {
    const texto = `parada 1\n${bloque('{"a":1}')}\nparada 2\n${bloque('{"b":2}')}\nfin`

    const tachado = redactarTranscript(texto)

    expect(sacarBloques(tachado).map((b) => JSON.parse(b))).toEqual([{ a: 1 }, { b: 2 }])
    expect(tachado).toContain('parada 1')
    expect(tachado).toContain('fin')
  })

  it('un bloque ilegible DE ORIGEN no tumba el tachado: cae a texto plano', () => {
    const texto = bloque('{"roto": sin cerrar') + '\ny token: abc123 suelto'

    const tachado = redactarTranscript(texto)

    expect(tachado).toContain('{"roto"')
    expect(tachado).not.toContain('token: abc123')
  })

  it('FAIL-CLOSED: el secreto DENTRO del bloque roto sale tachado, nunca crudo', () => {
    // El agujero al reves: si el camino del catch escribiera el bloque sin
    // tachar, el tachado por campo habria ABIERTO la fuga que vino a cerrar.
    const texto = bloque('{"nota": "pide token: abc123" y aqui se rompe')

    const tachado = redactarTranscript(texto)

    expect(tachado).not.toContain('abc123')
    expect(tachado).toContain('***')
  })
})
