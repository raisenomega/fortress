import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mcpGlobalSegunConfianza } from '@domain/connectors/mcp-config'
import { buildDisallowedTools } from './build-allowed-tools'

/** PASO 137 (frontera FIRMADA): trusted DEGRADA — el trabajo sin confianza
 *  pierde web y conectores; el confiable de HOY no cambia en nada. */

describe('TRABAJO NO CONFIABLE SIN WEB: la negacion de verdad', () => {
  it('lectura/auditoria/acceptEdits sin confianza niegan WebSearch Y WebFetch', () => {
    for (const mode of ['lectura', 'auditoria', 'acceptEdits'] as const) {
      const fuera = buildDisallowedTools(mode, false)
      expect(fuera).toContain('WebSearch')
      expect(fuera).toContain('WebFetch')
    }
  })

  it('TRABAJO CONFIABLE IGUAL que hoy: lectura solo Bash; el resto, nada', () => {
    expect(buildDisallowedTools('lectura', true)).toEqual(['Bash'])
    expect(buildDisallowedTools('auditoria', true)).toEqual([])
    expect(buildDisallowedTools('acceptEdits', true)).toEqual([])
  })
})

describe('CONECTORES GATEADOS por confianza, en el punto unico del turno', () => {
  it('sin confianza el cfg global es null; con confianza viaja como hoy', () => {
    expect(mcpGlobalSegunConfianza('{"mcpServers":{}}', false)).toBeNull()
    expect(mcpGlobalSegunConfianza('{"mcpServers":{}}', true)).toBe('{"mcpServers":{}}')
    expect(mcpGlobalSegunConfianza(null, true)).toBeNull()
  })

  it('el turno usa el gate y el CLI pasa la confianza (pins a la invocacion)', () => {
    expect(readFileSync('src/infrastructure/claude-code/args-del-turno.ts', 'utf8')).toContain('mcpGlobalSegunConfianza(') // prettier-ignore
    expect(readFileSync('src/infrastructure/claude-code/claude-cli.ts', 'utf8')).toContain('buildDisallowedTools(permissionMode, trusted)') // prettier-ignore
  })
})
