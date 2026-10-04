import { describe, expect, it } from 'vitest'
import { acotarContenido, TOPE_DE_FICHERO_EN_EXPEDIENTE } from './acotado-del-expediente'

/**
 * DEUDAS §18, medido en vivo el 2026-10-03: el expediente del CVE con el lock
 * DENTRO costo $8,90 y salio SIN veredicto; con la nota, 26 KB, $1,04 y
 * APROBADO. Este modulo es ese experimento convertido en contrato.
 */
describe('el acotado del expediente de OMEGA', () => {
  it('un fichero sobre el tope se sustituye por la nota legible, con path y KB', () => {
    const gordo = 'x'.repeat(370 * 1024)
    const nota = acotarContenido('package-lock.json', gordo)
    expect(nota).toBe(
      '[package-lock.json omitido por tamano (370 KB); el diff muestra sus cambios]'
    )
  })

  it('un fichero normal pasa INTACTO: el acotado es para la clase lock/generados', () => {
    const codigo = 'export const a = 1\n'.repeat(100) // ~2 KB, como un .ts de 75 lineas
    expect(acotarContenido('src/a.ts', codigo)).toBe(codigo)
  })

  it('el tope deja pasar CUALQUIER fichero del repo propio (75 lineas) con margen', () => {
    expect(TOPE_DE_FICHERO_EN_EXPEDIENTE).toBeGreaterThanOrEqual(16 * 1024)
    // y corta MUCHO antes del lock que costo $8,90: el tope es de dinero.
    expect(TOPE_DE_FICHERO_EN_EXPEDIENTE).toBeLessThanOrEqual(64 * 1024)
  })

  it('en el borde exacto no se acota: el tope es "hasta aqui incluido"', () => {
    const justo = 'y'.repeat(TOPE_DE_FICHERO_EN_EXPEDIENTE)
    expect(acotarContenido('a.json', justo)).toBe(justo)
    expect(acotarContenido('a.json', justo + 'y')).toContain('omitido por tamano')
  })
})
