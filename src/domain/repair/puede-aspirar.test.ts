import { describe, expect, it } from 'vitest'
import type { ConfigState } from './auto-merge-config'
import { DEFAULT_POLICY } from './auto-merge-policy'
import { puedeAspirar } from './puede-aspirar'

/** El cerco real de este repo: solo LOW, y con `ipc/**` excluido. */
const CERCO: ConfigState = {
  kind: 'valid',
  policy: {
    ...DEFAULT_POLICY, enabled: true, severities: ['LOW'],
    blacklist: ['src/infrastructure/ipc/**', 'docs/**']
  } // prettier-ignore
}

const LIBRE = 'src/infrastructure/claude-code/run-accumulator.ts'
const VETADO = 'src/infrastructure/ipc/graph-action-handlers.ts'

describe('si un hallazgo puede aspirar a integrarse solo', () => {
  it('LOW en un fichero que la lista no cubre: puede aspirar', () => {
    expect(puedeAspirar('LOW', LIBRE, CERCO)).toBe(true)
  })

  it('LOW pero en un fichero excluido: no puede, y se sabe sin generar nada', () => {
    expect(puedeAspirar('LOW', VETADO, CERCO)).toBe(false)
  })

  it('MEDIUM donde el cerco solo admite LOW: no puede', () => {
    expect(puedeAspirar('MEDIUM', LIBRE, CERCO)).toBe(false)
  })

  it('un proyecto que NO declara auto-merge no congela: todo puede aspirar', () => {
    // Parece al reves y no lo es. Sin cerco no hay nada que se integre solo, asi
    // que todo el trabajo de ese proyecto es para firma humana por definicion:
    // filtrar ahi no ahorraria gasto inutil, apagaria el motor entero.
    expect(puedeAspirar('MEDIUM', VETADO, { kind: 'invalid', reason: 'falta autoMerge' })).toBe(true) // prettier-ignore
    expect(puedeAspirar('MEDIUM', VETADO, { kind: 'not-present' })).toBe(true)
  })

  it('un cerco declarado pero APAGADO tampoco congela', () => {
    const apagado: ConfigState = { kind: 'valid', policy: { ...CERCO.policy, enabled: false } }
    expect(puedeAspirar('MEDIUM', VETADO, apagado)).toBe(true)
  })
})
