import Database from 'better-sqlite3'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { afterEach, describe, expect, it } from 'vitest'
import { supervivientesDegradadas } from '@domain/project/severidad-al-fundir'
import { masUrgente } from '@domain/shared/severity'
import { temporal } from './base-temporal-fixture'
import { leerVictimas, updatesParaElOperador } from './reparar-gravedad'

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

/**
 * El gesto del operador se IMPRIME, no se ejecuta. Escribir en la base real
 * dejo de ser una capacidad de este repo: no hay flag que alcanzar porque no
 * hay flag.
 */
describe('el plan entrega los UPDATE para que los corra una persona', () => {
  const victima = { id: 'dbf50a77', viva: 'MEDIUM', maxima: 'HIGH' } as const

  it('un UPDATE por victima, con el cambio anotado al lado', () => {
    const lineas = updatesParaElOperador([victima])

    expect(lineas[0]).toContain('gesto humano, con app cerrada y backup')
    expect(lineas[1]).toBe(
      "UPDATE findings SET severity='HIGH' WHERE id='dbf50a77';  -- MEDIUM -> HIGH"
    )
    expect(lineas.at(-1)).toContain('Este script NO escribe')
  })

  it('sin victimas no propone nada: no hay gesto que pedir', () => {
    expect(updatesParaElOperador([])).toEqual([])
  })
})
