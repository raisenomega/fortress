import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { DimensionInput } from '@domain/score/integral-score'
import { readProjectScripts } from '../claude-code/project-scripts'
import { runCommand } from './run-command'

const FAILS: readonly DetectedFinding[] = [
  { severity: 'HIGH', title: 'Los tests fallan', file: '', line: null }
]
const NO_SCRIPT: readonly DetectedFinding[] = [
  { severity: 'MEDIUM', title: 'Hay tests pero sin script para correrlos', file: '', line: null }
]

function pick(scripts: readonly string[], names: readonly string[]): string | undefined {
  return names.find((name) => scripts.includes(name))
}

function hasTestFiles(projectPath: string): boolean {
  const files = runCommand('git', ['ls-files'], projectPath).out
  return /\.(test|spec)\.[jt]sx?|(^|\/)__tests__\//.test(files)
}

/**
 * Probe de Tests: sin tests = 0 (MEDIDO, no "sin datos"). Si hay, corre la suite
 * (CI=true, una vez) y penaliza si falla. Pasar = limpio (100).
 */
export function testsProbe(projectPath: string): DimensionInput {
  const script = pick(readProjectScripts(projectPath), ['test:unit', 'test', 'unit'])
  if (!script && !hasTestFiles(projectPath)) return { score: 0 }
  if (!script) return NO_SCRIPT
  return runCommand('npm', ['run', script], projectPath).code === 0 ? [] : FAILS
}
