import type { CapabilityNote, NewCapabilityNote } from './capability-note'

/** Persistencia de las notas de refuerzo hacia una capacidad. Solo datos. */
export interface CapabilityNoteRepository {
  add(note: NewCapabilityNote): CapabilityNote
  /** Notas de una capacidad, de la mas reciente a la mas antigua. */
  listFor(capabilityId: string): readonly CapabilityNote[]
}
