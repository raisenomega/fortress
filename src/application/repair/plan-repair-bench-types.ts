import type { FindingMemory } from '@domain/project/finding-memory'
import type { SelfNoteDraft, SelfObservation } from '@domain/system/self-observation'
import type { ConfigState } from '@domain/repair/auto-merge-config'
import type { Evidencia } from '@domain/repair/evidencia-obsolescencia'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'

export interface Bench {
  readonly context: AppContext
  readonly inserted: Proposal[]
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
  /** Auto-observaciones asentadas durante la corrida. */
  readonly observadas: unknown[]
  /** La memoria que recibio el analista en cada estudio: lo ya atendido. */
  readonly memoria: Array<readonly string[]>
  /** Con que se pidio el descuento por obsoleto: debe ser el HEAD, no el escaneo. */
  readonly anclaDelDescuento: string[]
  /** Extinciones pedidas: ids, cuando, con que motivo y a peticion de QUIEN. */
  readonly extinguidos: Array<{ ids: readonly string[]; at: string; motivo: string; quien: string }> // prettier-ignore
  /** Mitigados por el motor: el OBSOLETO que no pudo probar lo que decia. */
  readonly mitigados: Array<{ id: string; note: string; at: string }>
  /** Dictamenes escritos sobre una fila que SIGUE mitigada (`sin_prueba`). */
  readonly anotados: Array<{ id: string; note: string }>
  /** Las que el analista devolvio a la cola: dijo que el problema sigue ahi. */
  readonly devueltos: Array<{ id: string; note: string }>
}

export interface Opciones {
  readonly findings: readonly FindingMemory[]
  /** Lo que el analista fake respondera como `status` (REAL / OBSOLETO). */
  readonly verdictStatus?: string
  readonly obsoleteIds?: readonly string[]
  readonly liveIds?: readonly string[]
  /** Propuestas ya existentes del proyecto, de la mas reciente a la mas vieja. */
  readonly proposals?: readonly Proposal[]
  /** Si el proyecto es el repo propio. Por defecto SI: el Motor es de FORTRESS. */
  readonly esRepoPropio?: boolean
  /** HEAD del repo; null simula un proyecto sin git. */
  readonly sha?: string | null
  /** true: el libro de vida LANZA al asentar (probar que no revierte nada). */
  readonly eventLogThrows?: boolean
  /** Lo que el analista fake devolvera en `notes` (sus apuntes sobre FORTRESS). */
  readonly notes?: readonly SelfNoteDraft[]
  /** El cerco que el proyecto declara en su disco. Por defecto NO declara
   *  ninguno: es como se comportaba la cola antes de que el freno existiera, y
   *  asi ninguna prueba vieja cambia de significado al llegar este. */
  readonly cerco?: ConfigState
  /** Lo que el analista fake devolvera como `evidencia` de su OBSOLETO. */
  readonly evidencia?: Evidencia
  /** Observaciones YA cerradas en la base: lo que el analista debe recibir para
   *  no volver a anotarlas. */
  readonly cerradas?: readonly SelfObservation[]
  /** El texto del fichero del hallazgo tal como lo lee la sonda. `null` imita el
   *  fichero que no se pudo leer, que NO es prueba de que el defecto se fuera. */
  readonly contenido?: string | null
  /** Lo que `fileHistory.tocadoPorElArreglo` devuelve: si el arreglo del turno
   *  toco el fichero citado en `evidencia.file`. Por defecto false (ADR-087 enm.). */
  readonly tocado?: boolean
  /** Lo que `fileHistory.baseDelFoco` devuelve: la base del trabajo enfocado, o
   *  `null` para caer a la base del turno (HEAD). Por defecto null (INC-A). */
  readonly baseFoco?: string | null
  /** Lo que `fileHistory.ficherosConMarcadorNacido` devuelve: los ficheros del
   *  foco cuyas adiciones traen el marcador. Por defecto [] (INC-B). */
  readonly nacidos?: readonly string[]
}
