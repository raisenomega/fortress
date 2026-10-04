import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo 1ab41ed5 (accesibilidad, misma clase que 2598e5df): el input del
 *  nombre del agente solo tenia placeholder, que no es nombre accesible. */
describe('el input del nombre del agente tiene nombre accesible, no solo placeholder', () => {
  it('lleva aria-label literal sobre el control', () => {
    expect(readFileSync('src/presentation/components/system/AgentDraftEditor.tsx', 'utf8')).toContain('aria-label="Nombre del agente"') // prettier-ignore
  })
})
