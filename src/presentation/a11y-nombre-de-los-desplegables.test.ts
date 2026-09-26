import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo 65db2e8f (accesibilidad, MEDIUM): los dos desplegables de la
 *  comparativa de agentes no tenian nombre; salen a su componente, que lo exige. */
describe('los desplegables de la comparativa de agentes tienen nombre accesible', () => {
  it('OmegaCompare nombra a cada uno', () => {
    expect(readFileSync('src/presentation/components/omega/OmegaCompare.tsx', 'utf8')).toContain('label="Primer agente a comparar"') // prettier-ignore
  })

  it('y el componente del desplegable lo pone como aria-label', () => {
    const ruta = 'src/presentation/components/omega/OmegaAgentSelect.tsx'
    expect(existsSync(ruta)).toBe(true)
    expect(readFileSync(ruta, 'utf8')).toContain('aria-label={label}')
  })
})
