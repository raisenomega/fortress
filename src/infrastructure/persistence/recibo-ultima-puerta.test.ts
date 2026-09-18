import { describe, expect, it } from 'vitest'
import { toAgentRun, toRunInsert, type AgentRunRow } from './agent-run-row'

const run = (recibo?: readonly string[]): Parameters<typeof toRunInsert>[1] => ({
  projectId: 'p1',
  agentId: null,
  kind: 'chat',
  durationMs: 10,
  failed: false,
  tools: ['Bash'],
  recibo
})

/**
 * ADR-093 §3.4. El tachado vive en `toRunInsert` y no donde se CONSTRUYE el
 * recibo, y la diferencia no es de estilo: todo INSERT pasa por esta funcion,
 * asi que no hay camino hasta el disco que se la salte. Si el tachado estuviera
 * arriba, bastaria un enhebrado nuevo —otro motor, otro caso de uso— que no
 * llamara al tachador para que un secreto llegara entero a la base.
 *
 * Es la misma leccion que el ADR midio de `tools`: hoy es seguro POR EL
 * ENVOLTORIO, no por el helper. Aqui el envoltorio es esta puerta.
 */
describe('el recibo se tacha en la ultima puerta antes del disco', () => {
  it('un secreto entra SIN tachar y sale tachado hacia la base', () => {
    const fila = toRunInsert('r1', run(['Bash: echo TOKEN=abc123secreto']), '2026-09-18')

    expect(fila.recibo).not.toContain('abc123secreto')
    expect(fila.recibo).toContain('***')
  })

  it('tacha TODAS las herramientas, no solo Bash', () => {
    const fila = toRunInsert('r1', run(['Grep: TOKEN=abc123secreto']), '2026-09-18')

    expect(fila.recibo).not.toContain('abc123secreto')
  })

  it('varias entradas viajan por LINEAS: un comando lleva comas dentro', () => {
    const fila = toRunInsert('r1', run(['Bash: a,b,c', 'Read: x.ts']), '2026-09-18')

    expect(fila.recibo).toBe('Bash: a,b,c\nRead: x.ts')
  })

  it('sin recibo va NULL, que es «no se capturo» y no «no corrio nada»', () => {
    expect(toRunInsert('r1', run(), '2026-09-18').recibo).toBeNull()
  })

  it('`tools` sigue siendo solo nombres: el recibo no lo contamina', () => {
    const fila = toRunInsert('r1', run(['Bash: npm ci']), '2026-09-18')

    expect(fila.tools).toBe('Bash')
  })
})

describe('y vuelve a leerse', () => {
  const fila = (recibo: string | null): AgentRunRow =>
    ({ id: 'r1', project_id: 'p1', agent_id: null, kind: 'chat', duration_ms: 1, failed: 0, tools: 'Bash', at: 'x', usage_known: 1, recibo }) as AgentRunRow // prettier-ignore

  it('una linea por herramienta', () => {
    expect(toAgentRun(fila('Bash: npm ci\nRead: x.ts')).recibo).toEqual(['Bash: npm ci', 'Read: x.ts']) // prettier-ignore
  })

  it('NULL se lee como ausente, nunca como lista vacia', () => {
    expect(toAgentRun(fila(null)).recibo).toBeUndefined()
  })
})
