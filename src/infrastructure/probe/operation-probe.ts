import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Severity } from '@domain/shared/severity'
import { runCommand } from './run-command'

const has = (base: string, ...names: string[]): boolean =>
  names.some((name) => existsSync(join(base, name)))

const at = (severity: Severity, title: string): DetectedFinding => ({
  severity,
  title,
  file: '',
  line: null
})

function gitignoreProtects(base: string): boolean {
  try {
    return /(^|\n)\s*\.?\*?\.env/.test(readFileSync(join(base, '.gitignore'), 'utf8'))
  } catch {
    return false
  }
}

/** Probe de Operacion: docs, CI, .gitignore y secretos trackeados. Solo confianza. */
export function operationProbe(projectPath: string): DetectedFinding[] {
  const out: DetectedFinding[] = []
  if (!has(projectPath, 'README.md', 'README', 'readme.md')) out.push(at('MEDIUM', 'Sin README'))
  if (!has(projectPath, 'ARCHITECTURE.md', 'docs/ARCHITECTURE.md')) {
    out.push(at('LOW', 'Sin ARCHITECTURE.md'))
  }
  if (!has(projectPath, '.github/workflows', '.gitlab-ci.yml', '.circleci')) {
    out.push(at('MEDIUM', 'Sin CI configurado'))
  }
  if (!has(projectPath, '.gitignore')) out.push(at('MEDIUM', 'Sin .gitignore'))
  else if (!gitignoreProtects(projectPath)) out.push(at('MEDIUM', '.gitignore no protege .env'))
  if (runCommand('git', ['ls-files', '.env'], projectPath).out.trim() !== '') {
    out.push(at('HIGH', '.env trackeado en git (secreto commiteado)'))
  }
  return out
}
