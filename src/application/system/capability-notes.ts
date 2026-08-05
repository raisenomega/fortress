import type { CapabilityNote, NewCapabilityNote } from '@domain/system/capability-note'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/** Deja una nota de refuerzo hacia una capacidad. Solo dato; no ejecuta nada. */
export function addCapabilityNote(
  context: AppContext,
  input: NewCapabilityNote
): Result<CapabilityNote> {
  const note = input.note.trim()
  if (note.length === 0) return err('La nota no puede estar vacia')
  if (context.capabilities.findById(input.capabilityId) === null) {
    return err('Esa capacidad ya no existe')
  }
  const author = input.author.trim() || 'operador'
  return ok(context.capabilityNotes.add({ capabilityId: input.capabilityId, author, note }))
}

/** Notas de una capacidad, de la mas reciente a la mas antigua. */
export function listCapabilityNotes(
  context: AppContext,
  capabilityId: string
): readonly CapabilityNote[] {
  return context.capabilityNotes.listFor(capabilityId)
}
