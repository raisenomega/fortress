import type { DetectedFinding } from './detected-finding'
import type { EstadoFinal } from './estado-scan'
import type { ModulosDelCierre } from './modulos-del-cierre'
import type { MotivoCierre } from './motivo-cierre'

/** Un fichero con su huella, para cuando no hay commit que citar. */
export interface HuellaDeFichero {
  readonly fichero: string
  readonly sha256: string
}

/**
 * Todo lo que el informe TRANSCRIBE. Nada que calcular: quien compone ya no
 * puede preguntarle nada al disco ni a la base, y por eso el entregable dice
 * lo que se decidio en el momento auditado y no lo que seria cierto hoy.
 */
export interface DatosDelInforme {
  readonly projectName: string
  readonly scanId: string
  readonly at: string
  /** HEAD del proyecto, o null si no hay git: null se DICE, no se rellena. */
  readonly headSha: string | null
  readonly version: string
  readonly estado: EstadoFinal
  readonly motivo: MotivoCierre
  readonly score: number
  /** Sobre cuantos hallazgos se calculo el score: el expediente, no la corrida. */
  readonly expediente: number
  /** Lo que ESTA corrida reporto. Casi siempre menor que el expediente. */
  readonly reportados: readonly DetectedFinding[]
  readonly paradasHechas: number
  readonly paradasTotal: number
  readonly ficherosCubiertos: number | null
  readonly ficherosTotal: number | null
  readonly modulos: ModulosDelCierre
  /** Solo cuando `headSha` es null: sin commit que citar, se citan ficheros. */
  readonly huellas: readonly HuellaDeFichero[]
}
