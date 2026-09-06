import { afterEach, describe, expect, it } from 'vitest'
import { writeFileSync } from 'fs'
import { temporal } from './base-temporal-fixture'
import { backupValido } from './reparar-gravedad-guardas'

const IDS = ['dbf50a77', '089b4ad5']
const tmp = temporal()
const ruta = (n: string): string => tmp.ruta(n)
const conFindings = (n: string, ids: readonly string[]): string => tmp.conFindings(n, ids)

afterEach(() => tmp.limpiar())

/**
 * El caso (a) es el del incidente: un `touch` satisfacia el guard viejo, y con
 * el se escribio en la base real. Aqui es lo primero que se rechaza.
 */
describe('el backup tiene que ser un backup, no un fichero que exista', () => {
  it('un fichero vacio (touch) NO pasa — el placebo del incidente', () => {
    const vacio = ruta('vacio.db')
    writeFileSync(vacio, '')

    // Ojo: SQLite ABRE un fichero de 0 bytes como base vacia, asi que no cae por
    // "no es SQLite" sino por no tener datos. Comprobar solo que abre habria
    // dejado pasar el mismo touch que engano al guard viejo.
    expect(backupValido(vacio, 2, IDS).ok).toBe(false)
    expect(backupValido(vacio, 2, IDS).porque).toContain('no tiene tabla findings')
  })

  it('un fichero que no es SQLite tampoco', () => {
    const basura = ruta('basura.db')
    writeFileSync(basura, 'esto no es una base de datos')

    expect(backupValido(basura, 2, IDS).porque).toContain('no abre como base SQLite legible')
  })

  it('y un fichero que ni existe, menos', () => {
    expect(backupValido(ruta('no-esta.db'), 2, IDS).porque).toContain(
      'no abre como base SQLite legible'
    )
  })

  it('SQLite legible pero SIN tabla findings: no pasa', () => {
    expect(backupValido(tmp.vacia('sin-tabla.db'), 2, IDS).porque).toContain('no tiene tabla findings') // prettier-ignore
  })

  it('con findings pero de OTRO momento (otro conteo): no pasa', () => {
    expect(backupValido(conFindings('viejo.db', IDS), 3, IDS).porque).toContain('de otro momento')
  })

  it('con findings pero le FALTA una de las victimas: no pasa, y dice cual', () => {
    const p = conFindings('incompleto.db', ['dbf50a77'])

    expect(backupValido(p, 1, IDS).porque).toContain('089b4ad5')
  })

  it('integro y con las dos victimas dentro: PASA', () => {
    expect(backupValido(conFindings('bueno.db', IDS), 2, IDS)).toEqual({
      ok: true,
      porque: 'backup legible, integro y con las filas que se tocan'
    })
  })
})
