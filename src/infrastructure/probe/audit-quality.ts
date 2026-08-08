import {
  computeIntegralScore,
  type IntegralScore,
  type InputByDimension
} from '@domain/score/integral-score'
import type { HasSeverity } from '@domain/shared/severity'
import { correctnessProbe } from './correctness-probe'
import { dependenciesProbe } from './dependencies-probe'
import { maintainabilityProbe } from './maintainability-probe'
import { operationProbe } from './operation-probe'
import { testsProbe } from './tests-probe'

export interface QualityAudit {
  readonly score: IntegralScore
  /** Entradas por dimension (hallazgos o score directo): para el desglose. */
  readonly inputs: InputByDimension
}

/**
 * Corre los probes deterministas y arma el score integral. Seguridad viene del
 * escaneo (securityFindings). Los 5 probes SOLO corren en proyectos de CONFIANZA;
 * si no, esas dimensiones quedan SIN DATOS y el global se marca PARCIAL.
 */
export function auditQuality(
  projectPath: string,
  trusted: boolean,
  securityFindings: readonly HasSeverity[] | null
): QualityAudit {
  const probes: InputByDimension = trusted
    ? {
        correctitud: correctnessProbe(projectPath),
        tests: testsProbe(projectPath),
        mantenibilidad: maintainabilityProbe(projectPath),
        dependencias: dependenciesProbe(projectPath),
        operacion: operationProbe(projectPath)
      }
    : {}
  const inputs: InputByDimension = { seguridad: securityFindings ?? undefined, ...probes }
  return { score: computeIntegralScore(inputs), inputs }
}
