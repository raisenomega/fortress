import type { FindingMemory } from '@domain/project/finding-memory'
import type { SelfNoteDraft } from '@domain/system/self-observation'
import type { ConfigState } from '@domain/repair/auto-merge-config'
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
  /** Con que se pidio el descuento por obsoleto: debe ser el HEAD, no el escaneo. */
  readonly anclaDelDescuento: string[]
}

export interface Opciones {
  readonly findings: readonly FindingMemory[]
  /** Lo que el analista fake respondera como `status` (REAL / OBSOLETO). */
  readonly verdictStatus?: string
  readonly obsoleteIds?: readonly string[]
  readonly liveIds?: readonly string[]
  /** Propuestas ya existentes del proyecto, de la mas reciente a la mas vieja. */
  readonly proposals?: readonly Proposal[]
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
}
