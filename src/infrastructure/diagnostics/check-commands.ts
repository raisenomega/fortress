import { spawnSync } from 'child_process'
import type { HealthCheck } from '@domain/health/health-check'

/** Nombres fijos, nunca input del usuario: no hay superficie de inyeccion. */
interface CommandProbe {
  readonly id: string
  readonly label: string
  readonly command: string
  readonly fix: string
}

const PROBES: readonly CommandProbe[] = [
  {
    id: 'git',
    label: 'Git',
    command: 'git',
    fix: 'Instala git (por ejemplo: sudo apt install git). Sin el no se detecta rama ni remoto.'
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    command: 'claude',
    fix: 'Instala Claude Code: npm install -g @anthropic-ai/claude-code. Solo hace falta para los scans headless.'
  }
]

function versionOf(command: string): string | null {
  try {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8', timeout: 5000 })
    if (result.error || result.status !== 0) return null
    return result.stdout.trim().split('\n')[0] || null
  } catch {
    return null
  }
}

/** Ausentes son advertencia, no error: la app funciona sin ellos, con menos. */
export function checkCommands(): HealthCheck[] {
  return PROBES.map((probe) => {
    const version = versionOf(probe.command)
    return version === null
      ? {
          id: probe.id,
          label: probe.label,
          level: 'warning' as const,
          detail: 'No instalado',
          fix: probe.fix
        }
      : { id: probe.id, label: probe.label, level: 'ok' as const, detail: version, fix: null }
  })
}
