import type { Scanner } from '@domain/scan/scanner'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { persistScan } from './persist-scan'
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

  return ok(await persistScan(context, project, outcome.value))
}
