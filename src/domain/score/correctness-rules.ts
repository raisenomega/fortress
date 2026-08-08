import type { DetectedFinding } from '../scan/detected-finding'
import type { Severity } from '../shared/severity'

export interface CorrectnessSignals {
  readonly hasTypecheck: boolean
  /** El gate de tipos corre sobre una config vacia (files/include []): no verifica nada. */
  readonly neuteredGate: boolean
  /** Errores del typecheck REAL (sobre las fuentes, no la config neutralizada). */
  readonly typeErrors: number
  readonly lintErrors: number
  readonly buildFailed: boolean
}

function bySize(n: number, high: number, critical: number): Severity {
  if (n >= critical) return 'CRITICAL'
  if (n >= high) return 'HIGH'
  return 'MEDIUM'
}

const at = (severity: Severity, title: string, file = ''): DetectedFinding => ({
  severity,
  title,
  file,
  line: null
})

/** Hallazgos de Correctitud a partir de señales deterministas del proyecto. */
export function correctnessFindings(s: CorrectnessSignals): DetectedFinding[] {
  const out: DetectedFinding[] = []
  if (s.neuteredGate) {
    out.push(
      at(
        'MEDIUM',
        'Control silenciosamente roto: el gate de tipos pasa en verde pero el chequeo real (tsc -b) encuentra errores',
        'tsconfig.json'
      )
    )
  }
  if (!s.hasTypecheck) {
    out.push(at('MEDIUM', 'Sin script de typecheck: los tipos no se verifican', 'package.json'))
  }
  if (s.typeErrors > 0) {
    out.push(at(bySize(s.typeErrors, 10, 50), `${s.typeErrors} errores de tipo (typecheck real)`))
  }
  if (s.lintErrors > 0) {
    out.push(at(bySize(s.lintErrors, 30, 100), `${s.lintErrors} errores de lint`))
  }
  if (s.buildFailed) {
    out.push(at('HIGH', 'El build falla'))
  }
  return out
}
