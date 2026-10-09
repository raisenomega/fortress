import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { buildAllowedTools, buildDisallowedTools } from '../claude-code/build-allowed-tools'

/** PASO 126: la corrida CTO REUTILIZA el candado libre (99/100, firmado). */

const fuente = (r: string): string => readFileSync(r, 'utf8')

describe('PERFIL A1: el candado libre, reutilizado sin tocarlo', () => {
  it("resuelve EXACTAMENTE ['WebSearch'] y Bash sigue QUITADO", () => {
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
    expect(buildDisallowedTools('libre')).toEqual(['Bash'])
  })

  it("run-cto corre con permissionMode 'libre' y NO nace un 6o modo", () => {
    expect(fuente('src/infrastructure/build/run-cto.ts')).toContain("permissionMode: 'libre'")
    expect(fuente('src/domain/settings/permission-mode.ts')).not.toContain("'cto'")
    expect(fuente('src/infrastructure/claude-code/build-allowed-tools.ts')).not.toContain("'cto'")
  })
})

describe('AISLAMIENTO y modelo: cuarto vacio, sin MCP, sin confianza', () => {
  it('trusted:false, agente sin MCP (agentLibre) y cuarto propio chat-cto', () => {
    const src = fuente('src/infrastructure/build/run-cto.ts')
    expect(src).toContain('trusted: false')
    expect(src).toContain('agentLibre(')
    expect(src).toContain("'chat-cto'")
    expect(src).not.toContain('readProjectMcpServers')
  })

  it('MODELO: el rol cto va al tope de la escalera (opus)', () => {
    expect(MODELO_POR_ROL.cto).toBe('opus')
  })
})
