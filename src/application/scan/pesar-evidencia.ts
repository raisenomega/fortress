import { findingIdentity } from '@domain/project/finding-identity'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { AppContext } from '../context'
import { ausentes } from '@domain/scan/ausencia'
import type { FindingMemory } from '@domain/project/finding-memory'
import { decideConservados } from './conservar-mitigado'

export interface EvidenciaDelEscaneo {
  /** Vivos que este escaneo no nombro. Siguen vivos: la ausencia no mata. */
  readonly stillAlive: readonly FindingMemory[]
  /** Ids que conservan su marca de mitigado en vez de volver a ACTIVE. */
  readonly conservados: ReadonlySet<string>
}

/**
 * Lo que un escaneo decide sobre lo que NO nombro. Ya no decide ninguna muerte.
 *
 * Aqui vivian dos preguntas y solo queda una. La otra —quien se extingue— salio
 * entera: el escaneo no cierra hallazgos, porque no nombrar algo no es haberlo
 * mirado. Cerrar es del motor, y solo despues de que un agente dictamine.
 *
 * La conservacion de la marca de mitigado si sigue preguntandole a git, y es
 * otra cosa: no decide si un problema existe, sino si una marca del OPERADOR
 * sigue en pie.
 */
export async function pesarEvidencia(
  context: AppContext,
  project: Project,
  findings: readonly DetectedFinding[]
): Promise<EvidenciaDelEscaneo> {
  const memoria = context.findings.listMemory(project.id)
  const reportadas = new Set(findings.map(findingIdentity))
  return {
    stillAlive: ausentes(memoria, reportadas),
    conservados: await decideConservados(context.fileHistory, project.path, memoria, reportadas)
  }
}
