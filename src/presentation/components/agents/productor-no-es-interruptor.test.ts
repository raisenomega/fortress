import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const fuente = (fichero: string): string =>
  readFileSync(join(process.cwd(), 'src/presentation/components/agents', fichero), 'utf8')

/**
 * El productor del Terminal no es un interruptor del operador (ADR-088,
 * Enmienda 2): apagarlo dejaria el turno de resolucion sin quien produzca. Se
 * mira el fuente porque pintar un Toggle o no pintarlo compila igual.
 */
describe('el panel de agentes no ofrece apagar al productor', () => {
  it('el panel decide el interruptor con esInterruptor, no pinta Toggle a todos', () => {
    const panel = fuente('AgentPanel.tsx')
    expect(panel).toMatch(/esInterruptor\(agent\) \?\s*\(\s*<AgentToggleRow/)
    expect(panel).toContain('<AgentFixedRow')
  })

  it('la fila fija no lleva interruptor: se ve y se abre, pero no se apaga', () => {
    const fila = fuente('AgentFixedRow.tsx')
    expect(fila).not.toContain('Toggle')
    expect(fila).toContain('onOpen(agent.id)')
  })
})
