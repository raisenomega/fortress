import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { countEdits } from '@domain/telemetry/edit-tools'
import { createRunAccumulator } from './run-accumulator'

/**
 * El stream REAL de un `claude -p` que hizo UN Edit, capturado del CLI 2.1.272 y
 * guardado tal cual (solo con las rutas locales neutralizadas). Se mide, no se
 * inventa: la forma de estos eventos es la unica fuente de verdad, y una
 * suposicion sobre ella nos costo un diagnostico entero.
 */
const MEDIDO = join(process.cwd(), 'src/infrastructure/claude-code/fixtures/edit-medido.jsonl')

function absorber(): ReturnType<ReturnType<typeof createRunAccumulator>['toReply']> {
  const acc = createRunAccumulator(() => {})
  for (const linea of readFileSync(MEDIDO, 'utf8').split('\n')) acc.absorb(linea)
  return acc.toReply(0)
}

describe('el Edit del CLI, medido de verdad', () => {
  it('el evento assistant del tool_use TRAE input.file_path', () => {
    const crudo = readFileSync(MEDIDO, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as { type?: string; message?: { content?: unknown[] } })

    const bloques = crudo
      .filter((e) => e.type === 'assistant')
      .flatMap((e) => (e.message?.content ?? []) as Array<{ type?: string; name?: string; input?: Record<string, unknown> }>) // prettier-ignore
    const edit = bloques.find((b) => b.type === 'tool_use' && b.name === 'Edit')

    expect(edit).toBeDefined()
    expect(edit?.input?.file_path).toBe('/repo/objetivo.md')
  })

  it('el acumulador lo convierte en una RUTA, no solo en un nombre', () => {
    const reply = absorber()

    expect(reply.tools).toContain('Edit')
    expect(reply.edits).toEqual(['/repo/objetivo.md'])
  })

  it('y las dos cuentas de «hubo ediciones» COINCIDEN: si divergen, hay bug', () => {
    const reply = absorber()

    // Es justo el invariante que se rompio en produccion (2 por nombre, 0 por
    // ruta) y que ahora queda grabado en el parte del lote cuando pasa.
    expect(countEdits(reply.tools)).toBe(reply.edits.length)
  })
})
