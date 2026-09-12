import { describe, expect, it } from 'vitest'
import { AREAS_DE_OBSERVACION } from './area-de-observacion'
import { areaDeFallo, observacionDeFallo } from './observacion-de-fallo'

describe('lo que FORTRESS aprende cuando se rompe (ADR-086)', () => {
  it('ASIENTA LA CLASE: que operacion corria y de que tipo fue el error', () => {
    const nota = observacionDeFallo('el ensamblado de la app', 'TypeError')

    expect(nota.kind).toBe('bug')
    expect(nota.area).toBe('fallo-de-arranque')
    expect(nota.note).toBe('FORTRESS rompio durante el ensamblado de la app: TypeError')
  })

  it('y el area sale del TIPO: lo de SQLite es persistencia, no arranque', () => {
    // better-sqlite3 levanta `SqliteError`; son los tres throw de persistence/.
    expect(areaDeFallo('SqliteError')).toBe('fallo-de-persistencia')
    expect(areaDeFallo('TypeError')).toBe('fallo-de-arranque')
  })

  it('EL MESSAGE NO ENTRA: la nota se compone, no se copia del error', () => {
    // La mutacion que este test existe para atrapar es meter el `message` en la
    // nota. Es lo natural —es lo informativo— y es exactamente lo que filtra.
    const error = new Error('fusion sin severidades: src/api/billing.ts|140|secreto')

    const nota = observacionDeFallo('una promesa rechazada sin manejar', error.name)

    expect(nota.note).not.toContain(error.message)
    expect(nota.note).toBe('FORTRESS rompio durante una promesa rechazada sin manejar: Error')
  })

  it('y su area esta en el vocabulario cerrado, no fuera de el', () => {
    // Sin esto, un fallo caeria en un `area` que el panel no sabe pintar ni
    // contar: la Fase 4 cerro el vocabulario justo para que eso no pasara.
    const areas: readonly string[] = AREAS_DE_OBSERVACION
    expect(areas).toContain('fallo-de-arranque')
    expect(areas).toContain('fallo-de-persistencia')
    expect(areas).not.toContain('fallo-de-ipc')
    expect(areas).not.toContain('fallo-de-render')
  })
})
