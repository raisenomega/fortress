import { computeIntegralScore, type InputByDimension } from '@domain/score/integral-score'
import type { QualityAudit, QualityAuditor } from '@domain/score/quality-auditor'
import type { HasSeverity } from '@domain/shared/severity'
import { correctnessProbe } from './correctness-probe'
import { dependenciesProbe } from './dependencies-probe'
import { maintainabilityProbe } from './maintainability-probe'
import { operationProbe } from './operation-probe'
import { readOnly } from './read-only-guard'
import { testsProbe } from './tests-probe'

/** Corre los 5 probes en serie (no en paralelo: no compiten por CPU/dist). */
async function runProbes(projectPath: string): Promise<InputByDimension> {
  return {
    correctitud: await correctnessProbe(projectPath),
    tests: await testsProbe(projectPath),
    mantenibilidad: await maintainabilityProbe(projectPath),
    dependencias: await dependenciesProbe(projectPath),
    operacion: await operationProbe(projectPath)
  }
}

/**
 * Corre los probes deterministas y arma el score integral. Seguridad viene del
 * escaneo (securityFindings). Los 5 probes SOLO corren en proyectos de CONFIANZA;
 * si no, esas dimensiones quedan SIN DATOS y el global se marca PARCIAL.
 */
export async function auditQuality(
  projectPath: string,
  trusted: boolean,
  securityFindings: readonly HasSeverity[] | null
): Promise<QualityAudit> {
  // readOnly: los probes de build dejan artefactos; se borran para no tocar el repo.
  const probes: InputByDimension = trusted
    ? await readOnly(projectPath, () => runProbes(projectPath))
    : {}
  const inputs: InputByDimension = { seguridad: securityFindings ?? undefined, ...probes }
  return { score: computeIntegralScore(inputs), inputs }
}

/** Adaptador del puerto QualityAuditor para la inyeccion en los casos de uso. */
export const probeAuditor: QualityAuditor = { audit: auditQuality }
