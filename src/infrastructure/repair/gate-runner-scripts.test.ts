import { join } from 'node:path'
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import type { GateCommand } from '@domain/repair/gate-config'
import { fakeNpm, repo, repoVacio } from './gate-runner-fixture'
import { createGateRunner } from './gate-runner'

const CMDS: readonly GateCommand[] = [
  { key: 'typecheck', args: ['run', 'typecheck'], timeoutMs: 5000 },
  { key: 'lint', args: ['run', 'lint'], timeoutMs: 5000 },
  { key: 'test:unit', args: ['run', 'test:unit'], timeoutMs: 5000 }
]

describe('createGateRunner: los scripts REALES del proyecto', () => {
  it('un repo que llama type-check a lo mismo se verifica igual', async () => {
    const { bin, llamadas } = fakeNpm()
    const worktree = repo('type-check', 'lint', 'test')
    const outcome = await createGateRunner('p1', bin, CMDS, 5000).run(worktree, 'base-sha')
    expect(outcome.ok).toBe(true)
    expect(outcome.skipped).toEqual([])
    // Se lanza el nombre del repo; la intencion sigue siendo la del gate. El
    // registro vive en el worktree: es lo unico que la caja deja escribir.
    const lanzados = readFileSync(join(worktree, llamadas), 'utf8')
    expect(lanzados).toContain('run type-check')
    expect(lanzados).toContain('run test')
    expect(outcome.commands.map((c) => c.command)).toEqual(['npm ci', 'typecheck', 'lint', 'test:unit']) // prettier-ignore
  })

  it('lo que el proyecto no sabe verificar se salta, y se dice', async () => {
    const outcome = await createGateRunner('p1', fakeNpm().bin, CMDS, 5000).run(
      repo('lint'),
      'base-sha'
    )
    expect(outcome.ok).toBe(true)
    expect(outcome.skipped).toEqual(['typecheck', 'test:unit'])
    expect(outcome.commands.map((c) => c.command)).toEqual(['npm ci', 'lint'])
  })

  it('sin ningun script del gate no hay gate que dar por pasado', async () => {
    const outcome = await createGateRunner('p1', fakeNpm().bin, CMDS, 5000).run(
      repo('build', 'dev'),
      'base-sha'
    )
    expect(outcome).toMatchObject({ ok: false, reason: 'gate_sin_verificacion', failedAt: 'scripts' }) // prettier-ignore
    expect(outcome.skipped).toEqual(['typecheck', 'lint', 'test:unit'])
    // El npm ci si corrio: su outcome se conserva para la autopsia.
    expect(outcome.commands.map((c) => c.command)).toEqual(['npm ci'])
  })

  it('un proyecto sin package.json tampoco se da por verificado', async () => {
    const outcome = await createGateRunner('p1', fakeNpm().bin, CMDS, 5000).run(
      repoVacio(),
      'base-sha'
    )
    expect(outcome).toMatchObject({ ok: false, reason: 'gate_sin_verificacion' })
  })
})
