import { countFindings } from '@domain/project/severity-counts'
import type { Scanner } from '@domain/scan/scanner'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import { nowIso } from '@domain/shared/id'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import type { ScanSummary } from './scan-types'

const NO_SCANNER =
  'Para escanear hace falta Claude Code: es quien lee el codigo del proyecto. ' +
  'Instalalo con npm install -g @anthropic-ai/claude-code.'

export async function runScan(
  context: AppContext,
  scanner: Scanner,
  projectId: string,
  onProgress: (delta: string) => void
): Promise<Result<ScanSummary>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  if (!scanner.isAvailable()) return err(NO_SCANNER)

  // Antes de arrancar nada: una carpeta que ya no existe da un error del
  // proceso hijo que parece un problema de instalacion y no lo es.
  const problem = scanner.precheck(project.path)
  if (problem) return err(problem)

  const outcome = await scanner.scan(
    { projectPath: project.path, projectName: project.name },
    onProgress
  )
  if (!outcome.ok) return err(outcome.error)

  const { findings, durationMs } = outcome.value
  const score = scoreFromFindings(findings)
  const scannedAt = nowIso()

  // Hallazgos y score describen el mismo escaneo: entran los dos o ninguno.
  context.transaction(() => {
    context.findings.replaceForProject(project.id, findings)
    context.projects.updateScan(project.id, score, scannedAt)
  })

  return ok({
    projectId: project.id,
    score,
    scannedAt,
    durationMs,
    counts: countFindings(findings)
  })
}
