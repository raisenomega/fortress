import type { ChildProcess } from 'child_process'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { killAllChildren, killChildrenOf, trackChild } from '../claude-code/child-registry'
import { CTO_OWNER } from '@domain/build/cto-owner'

/**
 * SELLO 1 del lazo (PASO 149): que el Detener del CTO corte el agente DE VERDAD.
 * El 148 midio la grieta —run-cto lanzaba SIN projectId, trackChild lo registraba
 * bajo null y killChildrenOf no lo alcanzaba: el boton era cosmetico—. Los pines
 * fijan el CAMINO (un cambio de una linea lo rompe sin que ningun proceso vivo lo
 * note); el mecanismo prueba el kill y el AISLAMIENTO del sentinel.
 */
function fakeChild(): ChildProcess & { killed: string[] } {
  const child = {
    killed: [] as string[],
    kill: (signal: string) => (child.killed.push(signal), true),
    once: () => child
  }
  return child as unknown as ChildProcess & { killed: string[] }
}

const runCto = readFileSync('src/infrastructure/build/run-cto.ts', 'utf8')
const stop = readFileSync('src/presentation/services/construir-service.ts', 'utf8')

beforeEach(() => {
  vi.useFakeTimers()
  killAllChildren()
})
afterEach(() => vi.useRealTimers())

describe('EL FRENO REAL DEL CTO (Sello 1)', () => {
  it('CTO_OWNER es el sentinel del cuarto del CTO', () => {
    expect(CTO_OWNER).toBe('chat-cto')
  })

  it('(a) el turno CTO registra su hijo bajo CTO_OWNER, jamas null', () => {
    expect(runCto).toContain('projectId: CTO_OWNER')
    expect(runCto).toContain("from '@domain/build/cto-owner'")
  })

  it('(b) el Detener del CTO rutea a CTO_OWNER, no al projectId anclado', () => {
    expect(stop).toContain("store.mode === 'cto' ? CTO_OWNER : projectId")
    expect(stop).toContain("from '@domain/build/cto-owner'")
  })

  it('(b/c) killChildrenOf(CTO_OWNER) mata al CTO y NO a un proyecto real', () => {
    const cto = fakeChild()
    const real = fakeChild()
    trackChild(cto, CTO_OWNER)
    trackChild(real, 'proyecto-real-123')
    expect(killChildrenOf(CTO_OWNER)).toBe(1)
    expect(cto.killed).toEqual(['SIGTERM'])
    expect(real.killed).toEqual([])
  })

  it('(d) regresion: parar por projectId real sigue matando por su id', () => {
    const real = fakeChild()
    trackChild(real, 'proyecto-real-999')
    expect(killChildrenOf('proyecto-real-999')).toBe(1)
    expect(real.killed).toEqual(['SIGTERM'])
  })
})
