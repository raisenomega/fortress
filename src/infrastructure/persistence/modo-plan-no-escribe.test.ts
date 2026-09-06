import Database from 'better-sqlite3'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { afterEach, describe, expect, it } from 'vitest'
import { supervivientesDegradadas } from '@domain/project/severidad-al-fundir'
import { masUrgente } from '@domain/shared/severity'
import { temporal } from './base-temporal-fixture'
import { leerVictimas } from './reparar-gravedad'

const victimas = (p: Parameters<typeof supervivientesDegradadas>[0]): ReturnType<typeof supervivientesDegradadas> => supervivientesDegradadas(p, masUrgente) // prettier-ignore

describe('el modo plan no escribe', () => {
  const tmp = temporal()
  afterEach(() => tmp.limpiar())

  it('leer las victimas deja el fichero byte a byte igual', () => {
    const ruta = tmp.conFindings('viva.db', ['a'])
    const huella = (): string => createHash('sha256').update(readFileSync(ruta)).digest('hex')
    const antes = huella()
    // Conexion READONLY: si leer las victimas escribiera algo, SQLite lanzaria.
    const db = new Database(ruta, { readonly: true })

    expect(leerVictimas(db, 'p', victimas)).toEqual([])
    db.close()
    expect(huella()).toBe(antes)
  })
})
