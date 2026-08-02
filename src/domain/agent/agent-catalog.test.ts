import { describe, expect, it } from 'vitest'
import { AGENT_IDS } from './agent'
import { AGENT_CATALOG, findAgent } from './agent-catalog'
import { ICON_NAMES } from '../shared/icon-name'

describe('AGENT_CATALOG', () => {
  it('tiene una entrada por cada id declarado, sin sobrantes', () => {
    expect(AGENT_CATALOG.map((agent) => agent.id).sort()).toEqual([...AGENT_IDS].sort())
  })

  it('no repite ids', () => {
    const ids = AGENT_CATALOG.map((agent) => agent.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada agente usa un icono que existe en el registro', () => {
    for (const agent of AGENT_CATALOG) {
      expect(ICON_NAMES).toContain(agent.iconName)
    }
  })

  it('ningun agente se queda sin nombre ni sin proposito', () => {
    for (const agent of AGENT_CATALOG) {
      expect(agent.name.trim().length).toBeGreaterThan(0)
      expect(agent.purpose.trim().length).toBeGreaterThan(0)
    }
  })

  it('lista primero los activos por defecto y luego los opcionales', () => {
    const activos = AGENT_CATALOG.filter((agent) => agent.enabledByDefault).length
    const primeros = AGENT_CATALOG.slice(0, activos)
    expect(primeros.every((agent) => agent.enabledByDefault)).toBe(true)
  })

  it('coloca el E2E Runner entre Build Error Resolver y Code Simplifier', () => {
    const orden = AGENT_CATALOG.map((agent) => agent.id)
    expect(orden.indexOf('e2e-runner')).toBe(orden.indexOf('build-error-resolver') + 1)
    expect(orden.indexOf('code-simplifier')).toBe(orden.indexOf('e2e-runner') + 1)
  })
})

describe('findAgent', () => {
  it('encuentra cualquier agente declarado', () => {
    for (const id of AGENT_IDS) {
      expect(findAgent(id)?.id).toBe(id)
    }
  })
})
