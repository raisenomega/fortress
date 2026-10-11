import { describe, expect, it } from 'vitest'
import { promptCto } from './cto-prompt'
import { promptLibre } from './libre-prompt'

/**
 * PASO 161b: el CTO y el chat-libre tambien pueden SEÑALAR una mejora de FORTRESS
 * mientras trabajan. Como no tienen herramientas, la señal es TEXTO: el mismo
 * bloque NOTAS que ya piden los tres prompts de Construir (peticion-de-notas.ts),
 * reusado sin inventar otra convencion. Quitar NOTAS_COMO_BLOQUE de cualquiera de
 * los dos prompts pone esto en rojo.
 */
const PROMPTS: ReadonlyArray<readonly [string, string]> = [
  ['CTO', promptCto([], 'una pregunta')],
  ['libre', promptLibre([], 'hola')]
]

describe('el CTO y el chat-libre invitan sus notas (PASO 161b)', () => {
  it.each(PROMPTS)('el de %s pide el bloque NOTAS con el texto compartido', (_nombre, prompt) => {
    expect(prompt).toContain('NOTAS:[')
    expect(prompt).toContain(':END-NOTAS')
    expect(prompt).toContain('la herramienta que te ejecuta, NO el proyecto')
  })
})
