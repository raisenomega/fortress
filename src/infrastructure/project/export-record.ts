import { writeFileSync } from 'fs'
import { join } from 'path'
import type { AppContext } from '@application/context'
import type { Project } from '@domain/project/project'
import { buildProjectRecord } from '@domain/project/project-record'
import { nowIso } from '@domain/shared/id'

/**
 * Antes de soltar un proyecto, deja un FORTRESS-RECORD.md EN SU carpeta (no
 * dentro de FORTRESS: eso dejaria proyectos fantasma). Mejor esfuerzo: si el
 * disco falla —la carpeta ya no existe, por ejemplo— el borrado sigue igual.
 */
export function exportProjectRecord(context: AppContext, project: Project): void {
  try {
    const findings = context.findings.listByProject(project.id)
    const scans = context.scans.listByProject(project.id, 100)
    const proposals = context.repairProposals.listByProject(project.id)
    writeFileSync(
      join(project.path, 'FORTRESS-RECORD.md'),
      buildProjectRecord(project, findings, scans, proposals, nowIso())
    )
  } catch {
    // Perder el record no debe impedir quitar el proyecto.
  }
}
