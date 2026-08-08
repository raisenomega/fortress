import type { IntegrityReport } from '../probe/integrity'
import type { HasSeverity } from '../shared/severity'
import type { InputByDimension, IntegralScore } from './integral-score'

/** Resultado de una auditoria integral: el score + las entradas por dimension. */
export interface QualityAudit {
  readonly score: IntegralScore
  /** Entradas por dimension (hallazgos o score directo): para el desglose. */
  readonly inputs: InputByDimension
  /** Capa 3: el proyecto quedo byte-identico tras correr los probes. */
  readonly integrity: IntegrityReport
}

/**
 * Puerto de auditoria de calidad. La infraestructura corre los probes (tsc, lint,
 * build, test, npm audit) y arma el score; la aplicacion solo conoce esta interfaz.
 */
export interface QualityAuditor {
  audit(
    projectPath: string,
    trusted: boolean,
    securityFindings: readonly HasSeverity[] | null
  ): Promise<QualityAudit>
}
