import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** Hallazgo 2598e5df (accesibilidad, MEDIUM): el campo principal del Terminal
 *  solo tenia placeholder, que no es nombre accesible. El de Construir, igual. */
describe('los dos campos de texto tienen nombre accesible, no solo placeholder', () => {
  it('el del Terminal', () => {
    expect(readFileSync('src/presentation/components/chat/ChatTextarea.tsx', 'utf8')).toContain('aria-label="Mensaje para el agente"') // prettier-ignore
  })

  it('el de Construir', () => {
    expect(readFileSync('src/presentation/components/construir/ConstruirInput.tsx', 'utf8')).toContain('aria-label="Describe lo que quieres construir o investigar"') // prettier-ignore
  })
})
