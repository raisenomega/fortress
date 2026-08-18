import { describe, expect, it } from 'vitest'
import { TAIL_CHARS, type GateCommand } from '@domain/repair/gate-config'
import { fakeNpm as npm, repo } from './gate-runner-fixture'
import { createGateRunner } from './gate-runner'

/** El binario fake, con el guion que decide su exit code. */
const fakeNpm = (script: string): string => npm(script).bin

const TRES = repo('typecheck', 'lint', 'test:unit')

const CMDS: readonly GateCommand[] = [
  { key: 'typecheck', args: ['run', 'typecheck'], timeoutMs: 5000 },
  { key: 'lint', args: ['run', 'lint'], timeoutMs: 300 },
  { key: 'test:unit', args: ['run', 'test:unit'], timeoutMs: 5000 }
]

describe('createGateRunner (binarios fake, sin mocks de child_process)', () => {
  it('todo verde: ok con 4 outcomes en orden (npm ci + 3)', async () => {
    const outcome = await createGateRunner(fakeNpm(':'), CMDS, 5000).run(TRES, 'base-sha')
    expect(outcome.ok).toBe(true)
    expect(outcome.commands.map((c) => c.command)).toEqual(['npm ci', 'typecheck', 'lint', 'test:unit']) // prettier-ignore
  })

  it('typecheck rojo: corta la cadena — lint y test:unit NUNCA corren', async () => {
    const bin = fakeNpm('[ "$2" = "typecheck" ] && exit 1')
    const outcome = await createGateRunner(bin, CMDS, 5000).run(TRES, 'base-sha')
    expect(outcome).toMatchObject({ ok: false, failedAt: 'typecheck', reason: 'gate_failed' })
    expect(outcome.commands.map((c) => c.command)).toEqual(['npm ci', 'typecheck'])
  })

  it('npm ci rojo: npm_ci_failed con 1 solo outcome', async () => {
    const bin = fakeNpm('[ "$1" = "ci" ] && exit 1')
    const outcome = await createGateRunner(bin, CMDS, 5000).run(TRES, 'base-sha')
    expect(outcome).toMatchObject({ ok: false, failedAt: 'npm ci', reason: 'npm_ci_failed' })
    expect(outcome.commands).toHaveLength(1)
  })

  it('lint colgado: el timeout lo mata y reporta gate_timeout', async () => {
    const bin = fakeNpm('[ "$2" = "lint" ] && sleep 30')
    const outcome = await createGateRunner(bin, CMDS, 5000).run(TRES, 'base-sha')
    expect(outcome).toMatchObject({ ok: false, failedAt: 'lint', reason: 'gate_timeout' })
    expect(outcome.commands.at(-1)?.timedOut).toBe(true)
  })

  it('stdout kilometrico: la autopsia conserva solo los ultimos chars', async () => {
    const bin = fakeNpm('[ "$2" = "typecheck" ] && { yes linea | head -c 20000; echo FINAL; exit 1; }') // prettier-ignore
    const outcome = await createGateRunner(bin, CMDS, 5000).run(TRES, 'base-sha')
    const roto = outcome.commands.at(-1)
    expect(roto?.stdoutTail.length).toBeLessThanOrEqual(TAIL_CHARS)
    expect(roto?.stdoutTail.trim().endsWith('FINAL')).toBe(true)
  })
})
