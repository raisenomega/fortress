import { describe, expect, it } from 'vitest'
import type { GateCommand } from '@domain/repair/gate-config'
import { killChildrenOf } from '../claude-code/child-registry'
import { fakeNpm, repo } from './gate-runner-fixture'
import { createGateRunner } from './gate-runner'

/**
 * Un comando del gate matado por una cancelacion (Detener, o cualquier
 * `cancelRun` del proyecto) NO es un rojo de codigo: el fix no se juzgo. Lo que
 * de verdad falla, sin senal, sigue siendo `gate_failed` — eso no se enmascara.
 */
const TRES = repo('typecheck', 'lint', 'test:unit')
const CMDS: readonly GateCommand[] = [
  { key: 'typecheck', args: ['run', 'typecheck'], timeoutMs: 10_000 },
  { key: 'lint', args: ['run', 'lint'], timeoutMs: 10_000 },
  { key: 'test:unit', args: ['run', 'test:unit'], timeoutMs: 10_000 }
]
const matarA = (owner: string): void => void setTimeout(() => killChildrenOf(owner), 500)

describe('un comando del gate detenido no es un rojo de codigo', () => {
  it('lint matado (Detener) → gate_detenido, no gate_failed', async () => {
    const bin = fakeNpm('[ "$2" = "lint" ] && sleep 20').bin
    matarA('p-det-lint')
    const r = await createGateRunner('p-det-lint', bin, CMDS, 10_000).run(TRES, 'base')
    expect(r).toMatchObject({ ok: false, failedAt: 'lint', reason: 'gate_detenido' })
  })

  it('npm ci matado → gate_detenido, no npm_ci_failed', async () => {
    const bin = fakeNpm('[ "$1" = "ci" ] && sleep 20').bin
    matarA('p-det-ci')
    const r = await createGateRunner('p-det-ci', bin, CMDS, 10_000).run(TRES, 'base')
    expect(r).toMatchObject({ ok: false, failedAt: 'npm ci', reason: 'gate_detenido' })
  })
})

describe('lo que falla de verdad no se enmascara', () => {
  it('un lint que sale 1 sin senal sigue siendo gate_failed', async () => {
    const bin = fakeNpm('[ "$2" = "lint" ] && exit 1').bin
    const r = await createGateRunner('p-real', bin, CMDS, 10_000).run(TRES, 'base')
    expect(r).toMatchObject({ ok: false, failedAt: 'lint', reason: 'gate_failed' })
  })

  it('un timeout del gate sigue siendo gate_timeout (el reloj tambien manda una senal)', async () => {
    const bin = fakeNpm('[ "$2" = "lint" ] && sleep 20').bin
    const lento = CMDS.map((c) => (c.key === 'lint' ? { ...c, timeoutMs: 400 } : c))
    const r = await createGateRunner('p-reloj', bin, lento, 10_000).run(TRES, 'base')
    expect(r).toMatchObject({ ok: false, failedAt: 'lint', reason: 'gate_timeout' })
  })
})
