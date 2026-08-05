import { findAgent } from '../agent/agent-catalog'
import { countFindings, presentSeverities } from '../project/severity-counts'
import { scoreFromFindings } from '../scan/score-from-findings'
import { computeQualityScore, qualityReportLines } from '../scan/quality-score'
import { SEVERITIES } from '../shared/severity'
import type { Workflow } from './workflow'
import { consolidate, participants, unreadable, type WorkflowOutcome } from './workflow-result'

const name = (id: string): string => findAgent(id as never)?.name ?? id

function findingLines(outcome: WorkflowOutcome): readonly string[] {
  const todos = consolidate(outcome.results)
  const counts = countFindings(todos)

  return SEVERITIES.filter((severity) => counts[severity] > 0).flatMap((severity) => [
    '',
    `### ${severity} (${counts[severity]})`,
    ...todos
      .filter((finding) => finding.severity === severity)
      .map(
        (f) =>
          `- ${f.title} — \`${f.file}${f.line === null ? '' : `:${f.line}`}\` · ${name(f.agentId)}`
      )
  ])
}

/** Informe consolidado del workflow, en markdown, listo para el chat. */
export function buildWorkflowReport(workflow: Workflow, outcome: WorkflowOutcome): string {
  const todos = consolidate(outcome.results)
  const counts = countFindings(todos)
  const resumen = presentSeverities(counts)
    .map((s) => `${counts[s]} ${s}`)
    .join(', ')
  const sinInforme = unreadable(outcome.results)

  const quienes = participants(outcome.results)
  const lineas = [
    `## ${workflow.label}`,
    '',
    `${quienes.length} agentes: ${quienes.map(name).join(' → ')}`,
    `Indice de estos hallazgos: ${scoreFromFindings(todos)}/100 (no es la nota de ` +
      `seguridad del proyecto) · ${todos.length === 0 ? 'sin hallazgos' : resumen}`
  ]

  // La auditoria integral (produccion) da la CALIDAD GENERAL: todas las dimensiones.
  if (workflow.id === 'produccion') {
    lineas.push('', ...qualityReportLines(computeQualityScore(todos)))
  }

  if (outcome.stoppedBy !== null) {
    lineas.push(
      '',
      `> Detenido tras ${name(outcome.stoppedBy)}: hay CRITICAL abiertos. Los pasos ` +
        'siguientes no se ejecutaron para no trabajar encima de un agujero.'
    )
  }

  if (sinInforme.length > 0) {
    lineas.push(
      '',
      `> Sin informe legible de: ${sinInforme.map(name).join(', ')}. No cuentan como limpios.`
    )
  }

  return [...lineas, ...findingLines(outcome)].join('\n')
}
