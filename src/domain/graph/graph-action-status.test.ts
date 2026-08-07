import { describe, expect, it } from 'vitest'
import type { AbSide } from './graph-actions'
import { abTone, installTone, verifyTone } from './graph-action-status'
import type { GraphStatus } from './graph-status'

const status = (over: Partial<GraphStatus>): GraphStatus => ({
  state: 'configurado',
  server: 'codebase-memory',
  source: 'x',
  ...over
})
const stats = { nodes: 10, edges: 5, files: 2, indexedAt: null, rootPath: null }
const side = (answered: boolean): AbSide => ({ tokens: 1, costUsd: 0, answered })

describe('verifyTone', () => {
  it('verde con las 3 tools clave, naranja si faltan', () => {
    const three = ['get_architecture', 'search_graph', 'trace_path']
    expect(verifyTone({ connected: true, tools: three }, false)).toBe('ok')
    expect(verifyTone({ connected: true, tools: ['get_architecture'] }, false)).toBe('warn')
  })

  it('rojo si no conecta; gris sin correr; naranja corriendo', () => {
    expect(verifyTone({ connected: false, tools: [] }, false)).toBe('error')
    expect(verifyTone(null, false)).toBe('idle')
    expect(verifyTone(null, true)).toBe('running')
  })
})

describe('installTone', () => {
  it('verde con indice, naranja configurado sin indice, rojo si fallo', () => {
    expect(installTone(status({ stats }), false, false)).toBe('ok')
    expect(installTone(status({ stats: null }), false, false)).toBe('warn')
    expect(installTone(status({}), false, true)).toBe('error')
  })
})

describe('abTone', () => {
  it('verde si ambas respondieron; rojo si una falla o hubo error', () => {
    expect(abTone({ question: '', lectura: side(true), normal: side(true) }, false, false)).toBe(
      'ok'
    )
    expect(abTone({ question: '', lectura: side(true), normal: side(false) }, false, false)).toBe(
      'error'
    )
    expect(abTone(null, false, true)).toBe('error')
    expect(abTone(null, true, false)).toBe('running')
  })
})
