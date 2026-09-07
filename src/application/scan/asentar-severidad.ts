import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

/** El escaneo lo hace el Security Reviewer: el asiento se le atribuye a el. */
const ESCANER = 'security-reviewer'

const sitio = (f: DetectedFinding): string => `${f.file}${f.line === null ? '' : `:${f.line}`}`

/**
 * Lo que la derivacion (ADR-080) cambio respecto a la palabra del modelo, en
 * UN asiento por escaneo en el Libro de la Vida. Es el patron de
 * `emitOmegaMismatch` llevado al escaneo: la banda que manda es la derivada, y
 * la del modelo se guarda para medir cuanto se calibra con el tiempo.
 *
 * Va como `nota`/`info`, no como `discrepancia`: eso significa "reportado no
 * cuadra con el disco" y cuenta contra la veracidad del agente (ADR-074, el
 * asiento no afirma mas de lo que sabe). Que el modelo dijera HIGH donde la
 * tabla dice CRITICAL no es un hallazgo falso; es calibracion.
 *
 * Un asiento por escaneo y no uno por hallazgo: cincuenta filas de "el modelo
 * dijo HIGH" enterrarian el Libro; la lista completa va en la evidencia.
 * Tambien se cuentan los que vinieron SIN ejes, que es la otra cara de la
 * calibracion. Sin nada que anotar, no se anota.
 *
 * Mejor esfuerzo: el escaneo ya esta guardado y perder este asiento no lo
 * invalida.
 */
export function asentarSeveridadDerivada(
  context: AppContext,
  project: Project,
  findings: readonly DetectedFinding[]
): void {
  const conEjes = findings.filter((f) => f.severidadDelModelo !== undefined)
  const distintas = conEjes.filter((f) => f.severidadDelModelo !== f.severity)
  const sinEjes = findings.filter((f) => f.sinEjes === true).length
  if (distintas.length === 0 && sinEjes === 0) return

  try {
    context.omegaLog.append({
      projectId: project.id,
      agentId: ESCANER,
      kind: 'nota',
      verdict: 'info',
      summary: `Severidad por ejes: ${distintas.length} de ${conEjes.length} con ejes difieren de lo que dijo el modelo; ${sinEjes} sin ejes.`, // prettier-ignore
      evidence: distintas
        .map(
          (f) =>
            `${sitio(f)} ${f.severidadDelModelo}→${f.severity} (${f.alcance}·${f.efecto}·${f.estado})`
        ) // prettier-ignore
        .join('; ')
    })
  } catch (error) {
    console.error('[scan] no se pudo asentar la severidad derivada', project.id, error)
  }
}
