import { describe, expect, it } from 'vitest'
import type { StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { CapabilityNoteRepository } from '@domain/system/capability-note-repository'
import type { AppContext } from '../context'
import { addCapabilityNote, listCapabilityNotes } from './capability-notes'

function context(exists: boolean): { ctx: AppContext; added: number } {
  let added = 0
  const capabilities: CapabilityRepository = {
    add: () => ({}) as StoredCapability,
    listAll: () => [],
    findById: () => (exists ? ({ id: 'c1' } as StoredCapability) : null),
    promote: () => {}
  }
  const capabilityNotes: CapabilityNoteRepository = {
    add: (n) => {
      added += 1
      return { ...n, id: 'n1', createdAt: 'now' }
    },
    listFor: () => [
      { id: 'n1', capabilityId: 'c1', author: 'operador', note: 'hola', createdAt: 'now' }
    ]
  }
  return { ctx: { capabilities, capabilityNotes } as unknown as AppContext, added: added }
}

describe('addCapabilityNote', () => {
  it('guarda una nota valida', () => {
    const { ctx } = context(true)
    expect(
      addCapabilityNote(ctx, { capabilityId: 'c1', author: 'operador', note: 'refuerza X' }).ok
    ).toBe(true)
  })

  it('rechaza una nota vacia', () => {
    expect(
      addCapabilityNote(context(true).ctx, { capabilityId: 'c1', author: 'x', note: ' ' }).ok
    ).toBe(false)
  })

  it('rechaza una capacidad inexistente', () => {
    expect(
      addCapabilityNote(context(false).ctx, { capabilityId: 'x', author: 'x', note: 'y' }).ok
    ).toBe(false)
  })
})

describe('listCapabilityNotes', () => {
  it('devuelve las notas de la capacidad', () => {
    expect(listCapabilityNotes(context(true).ctx, 'c1')).toHaveLength(1)
  })
})
