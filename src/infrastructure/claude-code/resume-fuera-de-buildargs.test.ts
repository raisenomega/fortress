import { mkdtempSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it, vi } from 'vitest'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { DEFAULT_BUDGET } from '@domain/settings/run-budget'

/** Los argumentos con los que se lanzaria `claude`, sin lanzarlo. */
const { lanzados } = vi.hoisted(() => ({ lanzados: [] as string[][] }))

vi.mock('child_process', async (original) => {
  const { hijoFalso } = await import('./hijo-falso-fixture')
  const real = await original<typeof import('child_process')>()
  const spawn = (_bin: string, args: string[]): unknown => (lanzados.push(args), hijoFalso())
  return { ...real, spawn }
})

const { createClaudeCodeAgent } = await import('./claude-code-agent')
const { buildArgs } = await import('./claude-cli')

const CLAVES = { read: () => null } as never
const peticion: CodeAgentRequest = {
  projectPath: mkdtempSync(join(tmpdir(), 'resume-')),
  projectId: 'p-resume',
  prompt: 'x',
  permissionMode: 'acceptEdits',
  agentId: 'productor',
  trusted: false
}

const lanzar = (over: Partial<CodeAgentRequest>): string[] => {
  void createClaudeCodeAgent(CLAVES, DEFAULT_BUDGET, false).run({ ...peticion, ...over }, () => undefined) // prettier-ignore
  return lanzados.at(-1) ?? []
}

describe('--resume lo pone claude-code-agent, NUNCA buildArgs (ADR-088, Enmienda 2)', () => {
  it('con sesion, reanuda en una DERIVADA: --resume <id> --fork-session', () => {
    const args = lanzar({ reanudarSesion: 'ses-1' })
    const i = args.indexOf('--resume')

    expect(args.slice(i, i + 3)).toEqual(['--resume', 'ses-1', '--fork-session'])
  })

  it('sin sesion, ni --resume ni --fork-session: sesion nueva', () => {
    const args = lanzar({})
    expect(args).not.toContain('--resume')
    expect(args).not.toContain('--fork-session')
  })

  it('buildArgs no sabe nada de sesiones: su salida nunca lleva --resume', () => {
    const args = buildArgs('x', 'acceptEdits', {}, 'productor', 0, null, false, [])
    expect(args).not.toContain('--resume')
    expect(args).not.toContain('--fork-session')
  })

  it('y claude-cli.ts, innegociable, sigue sin mencionarlas', () => {
    const fuente = readFileSync(join(process.cwd(), 'src/infrastructure/claude-code/claude-cli.ts'), 'utf8') // prettier-ignore
    expect(fuente).not.toMatch(/resume|fork-session/)
  })
})
