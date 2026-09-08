import type { DetectedFinding } from '@domain/scan/detected-finding'
import { termometroDeOtro, UMBRAL_DE_OTRO } from '@domain/scan/termometro-de-otro'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

const ESCANER = 'security-reviewer'

const sitio = (f: DetectedFinding): string => `${f.file}${f.line === null ? '' : `:${f.line}`}`

/**
 * Cuanto de este escaneo cayo en `otro`, en UN asiento del Libro (ADR-081).
 *
 * TAXONOMIA-DE-DEFECTOS fijo el criterio —por encima del 15% hay que revisar el
 * vocabulario— y lo dejo en prosa: `mailbd` llevaba 33% y 29% y nadie se
 * entero. Esto lo hace medible, y es el criterio de cierre del arco.
 *
 * Va como `nota`/`info`, igual que la severidad derivada y por la misma razon:
 * `discrepancia` significa "lo reportado no cuadra con el disco" y cuenta
 * contra la veracidad del agente (ADR-074). Que el escaner no encuentre tipo no
 * es una mentira suya; es que el vocabulario no llega. Superar el umbral se
 * dice en el texto, no subiendo el veredicto.
 *
 * Mejor esfuerzo: el escaneo ya esta guardado y perder este asiento no lo
 * invalida.
 */
export function asentarVocabulario(
  context: AppContext,
  project: Project,
  findings: readonly DetectedFinding[]
): void {
  const t = termometroDeOtro(findings)
  if (t === null) return

  const pct = Math.round(t.proporcion * 100)
  const veredicto = t.superaUmbral
    ? `supera el ${Math.round(UMBRAL_DE_OTRO * 100)}%: al vocabulario le falta un tipo`
    : 'dentro del umbral'
  try {
    context.omegaLog.append({
      projectId: project.id,
      agentId: ESCANER,
      kind: 'nota',
      verdict: 'info',
      summary: `Vocabulario: ${t.otros} de ${t.total} hallazgos cayeron a "otro" (${pct}%), ${veredicto}.`, // prettier-ignore
      evidence: findings
        .filter((f) => f.tipo === 'otro')
        .map(sitio)
        .join('; ')
    })
  } catch (error) {
    console.error('[scan] no se pudo asentar el termometro de otro', project.id, error)
  }
}
