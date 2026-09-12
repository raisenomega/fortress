import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

/**
 * La historia se llevo su propia consulta para NO tocar la del motor, y eso se
 * fija por lectura del fuente porque las dos formas compilan.
 *
 * `SELECT_MEMORY` es el expediente que usan diez sitios del motor y del escaneo,
 * y ninguno pinta nada. Anadirle el motivo y el quien para una pantalla los
 * habria cargado con dos columnas que no miran — y `FindingMemory` dice en su
 * docblock que se mantiene aparte de `Finding` justo por eso.
 */
describe('la pagina de historia no toco el expediente del motor', () => {
  const sql = fuente('src/infrastructure/persistence/finding-sql.ts')

  it('SELECT_MEMORY sigue con sus columnas: ni el motivo ni el quien', () => {
    const memoria = sql.slice(sql.indexOf('SELECT_MEMORY'), sql.indexOf('SELECT_BY_IDENTITY'))
    expect(memoria).not.toContain('extinct_reason')
    expect(memoria).not.toContain('extinguido_por')
  })

  it('y sigue ordenando por URGENCIA, que es lo que el motor necesita', () => {
    expect(sql).toContain('SELECT_MEMORY')
    expect(sql.slice(sql.indexOf('SELECT_MEMORY'))).toContain('ORDER BY ${BY_URGENCY}')
  })

  it('la consulta de la historia vive aparte y filtra solo lo EXTINCT', () => {
    const historia = fuente('src/infrastructure/persistence/finding-historia-sql.ts')
    expect(historia).toContain("lifecycle = 'EXTINCT'")
    expect(historia).toContain('extinct_reason')
    // El `IS NULL` delante del ORDER BY: sin el, las fusiones abrirían la lista.
    expect(historia).toContain('ORDER BY resolved_at IS NULL, resolved_at DESC')
  })

  it('y `FindingMemory` no gano campos de cierre', () => {
    const memoria = fuente('src/domain/project/finding-memory.ts')
    expect(memoria).not.toContain('extinctReason')
    expect(memoria).not.toContain('extinguidoPor')
  })
})
