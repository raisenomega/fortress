import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sinFenceExterior, splitBlocks } from './markdown-blocks'

/** PASO 96, la dieta del CHAT (reproduce el smoke rojo del 95): el modelo
 *  envuelve TODO en un fence, escribe tablas y baja a #### — el casero de los
 *  docs no lo cubria y la pantalla salia "como terminal". */

const RESPUESTA = '```markdown\n## Resumen\n| a | b |\n|---|---|\n| 1 | 2 |\n```'

describe('el fence EXTERIOR unico se desenvuelve', () => {
  it('la respuesta entera envuelta deja de ser un <pre> crudo', () => {
    const bloques = splitBlocks(sinFenceExterior(RESPUESTA))
    expect(bloques[0]).toEqual({ type: 'heading', level: 2, lines: ['Resumen'] })
    expect(bloques.some((b) => b.type === 'code')).toBe(false)
  })

  it('y el COMPONENTE lo llama de verdad (un helper sin enchufar no pinta nada)', () => {
    // Pin de la LLAMADA, no de la palabra: la leccion del M3 del PASO 91.
    expect(readFileSync('src/presentation/components/docs/Markdown.tsx', 'utf8')).toContain('sinFenceExterior(text)') // prettier-ignore
  })

  it('un fence INTERIOR con prosa alrededor NO se toca: sigue siendo codigo', () => {
    const texto = 'mira:\n```\nconst x = 1\n```\ny sigue'
    expect(sinFenceExterior(texto)).toBe(texto)
  })
})

describe('tablas y encabezados profundos', () => {
  it('la tabla | a | b | es un bloque table SIN la fila separadora', () => {
    const bloques = splitBlocks('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(bloques).toEqual([{ type: 'table', lines: ['| a | b |', '| 1 | 2 |'] }])
  })

  it('#### nivel 4 (y mas hondo) es encabezado, no texto crudo', () => {
    expect(splitBlocks('#### Detalle')[0].type).toBe('heading')
    expect(splitBlocks('##### Mas')[0].type).toBe('heading')
  })
})
