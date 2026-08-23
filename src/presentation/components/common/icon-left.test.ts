import { describe, expect, it } from 'vitest'
import { ICON_NAMES } from '@domain/shared/icon-name'
import { FLOW_ICONS } from './icon-registry-flow'

describe('chevron-left', () => {
  it('esta en la lista de nombres del dominio', () => {
    // Sin el, el paginador tuvo que ir vertical (arriba/abajo) en cp112.
    expect(ICON_NAMES).toContain('chevron-left')
  })

  it('tiene dibujo: un nombre sin registro pinta un hueco', () => {
    expect(FLOW_ICONS['chevron-left']).toBeDefined()
  })

  it('sigue teniendo su pareja', () => {
    expect(ICON_NAMES).toContain('chevron-right')
    expect(FLOW_ICONS['chevron-right']).toBeDefined()
  })
})
