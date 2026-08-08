import { correctnessFindings, type CorrectnessSignals } from '@domain/score/correctness-rules'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { readProjectScripts } from '../claude-code/project-scripts'
import { runCommand } from './run-command'
import { auditTsc } from './tsconfig-audit'

function pick(scripts: readonly string[], names: readonly string[]): string | undefined {
  return names.find((name) => scripts.includes(name))
}

/** Cuenta los errores del resumen de eslint ("N problems (M errors, ...)"). */
function lintErrors(out: string): number {
  const match = out.match(/(\d+)\s+errors?\b/)
  return match ? Number(match[1]) : 0
}

/** Probe de Correctitud: typecheck REAL (tsc -b) + verde falso + lint + build. */
export async function correctnessProbe(projectPath: string): Promise<DetectedFinding[]> {
  const scripts = readProjectScripts(projectPath)
  const ts = await auditTsc(projectPath, pick(scripts, ['typecheck', 'type-check', 'tsc']))
  const lint = pick(scripts, ['lint', 'eslint'])
  const build = pick(scripts, ['build'])
  const signals: CorrectnessSignals = {
    hasTypecheck: ts.hasTs,
    neuteredGate: ts.neutered,
    typeErrors: ts.errors,
    lintErrors: lint ? lintErrors((await runCommand('npm', ['run', lint], projectPath)).out) : 0,
    buildFailed: build ? (await runCommand('npm', ['run', build], projectPath)).code !== 0 : false
  }
  return correctnessFindings(signals)
}
