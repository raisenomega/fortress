import { checkFinding } from '@domain/omega/finding-check'
import type { Finding, Project } from '@domain/project/project'
import type { AppContext } from '../context'

const locate = (f: Finding): string => (f.line === null ? f.file : `${f.file}:${f.line}`)

/**
 * OMEGA deja constancia de cada decision de push en el Libro de la Vida. NO
 * cambia la regla (cualquier CRITICAL bloquea): la documenta con evidencia —
 * que CRITICAL, y cuantos verifico OMEGA contra el disco. El veto no es
 * inapelable por decreto; es fuerte porque cita pruebas.
 */
export function recordPushDecision(context: AppContext, project: Project, blocked: boolean): void {
  if (!blocked) {
    context.omegaLog.append({
      projectId: project.id,
      agentId: 'sentinel-omega',
      kind: 'nota',
      verdict: 'ok',
      summary: 'Push autorizado: sin CRITICAL en el ultimo escaneo.',
      evidence: ''
    })
    return
  }

  const criticals = context.findings
    .listByProject(project.id)
    .filter((f) => f.status === 'open' && f.severity === 'CRITICAL')
  const verificados = criticals.filter(
    (f) =>
      checkFinding(f, context.filesystemProbe.probe(project.path, f.file)).verdict !==
      'discrepancia'
  ).length

  context.omegaLog.append({
    projectId: project.id,
    agentId: 'sentinel-omega',
    kind: 'nota',
    verdict: 'veto',
    summary: `VETO de push: ${criticals.length} CRITICAL (${verificados} verificados en disco).`,
    evidence: criticals.map(locate).join(', ')
  })
}
