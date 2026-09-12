import { describe, expect, it } from 'vitest'
import { observacionDeFallo, tipoDeFallo } from './observacion-de-fallo'

/** Un fallo real de este codigo: `severidad-al-fundir.ts:33` concatena la
 *  identidad del hallazgo, que es `fichero|linea|tipo` del codigo del CLIENTE. */
const MENSAJE_QUE_DELATA = 'fusion sin severidades: src/api/billing.ts|140|secreto'

/**
 * La pieza que hace la nota segura POR CONSTRUCCION y no por auditar los sitios
 * que lanzan. `error.name` es escribible: la garantia no puede ser que nadie lo
 * pise, tiene que ser que, pisado, no pase.
 */
describe('el filtro de forma del tipo de error', () => {
  it('SEGURO POR CONSTRUCCION: un `name` pisado con una ruta NO llega a la nota', () => {
    expect(tipoDeFallo('/media/cliente/ACME/src/api/billing.ts:140')).toBe('desconocido')
    expect(tipoDeFallo(MENSAJE_QUE_DELATA)).toBe('desconocido')
    expect(tipoDeFallo('Error con espacios')).toBe('desconocido')

    const nota = observacionDeFallo('una excepcion sin capturar', MENSAJE_QUE_DELATA)
    expect(nota.note).not.toContain('billing.ts')
    expect(nota.note).not.toContain('/media/')
    expect(nota.note).toContain('desconocido')
  })

  it('deja pasar lo que SI es un nombre de clase', () => {
    expect(tipoDeFallo('SqliteError')).toBe('SqliteError')
    expect(tipoDeFallo('TypeError')).toBe('TypeError')
    expect(tipoDeFallo('Error')).toBe('Error')
  })

  it('y tampoco llega un `name` ausente, nulo o de otro tipo', () => {
    expect(tipoDeFallo(undefined)).toBe('desconocido')
    expect(tipoDeFallo(null)).toBe('desconocido')
    expect(tipoDeFallo(42)).toBe('desconocido')
    expect(tipoDeFallo('')).toBe('desconocido')
  })
})
