import { describe, expect, it } from 'vitest'
import { entradasDeLaNota, planDeRestauracion, type FilaDeFamilia, type Nota } from './restauracion-de-severidad' // prettier-ignore

const fila = (over: Partial<FilaDeFamilia> = {}): FilaDeFamilia => ({
  id: 'f1', file: 'src/theme.css', line: 23, tipo: 'accesibilidad', severity: 'HIGH', lifecycle: 'ACTIVE', title: 'Contraste 4.08:1', ...over
}) // prettier-ignore
const nota = (evidence: string, at = '2026-09-12T10:00:00Z'): Nota => ({ at, evidence })
const ENTRADA = 'src/theme.css:23 LOW→HIGH (anonimo·disponibilidad·explotable-hoy)'

describe('entradasDeLaNota: la palabra del modelo, leida de la evidencia del Libro', () => {
  it('parte por "; " y lee sitio, modelo, banda y ejes; lo que no cuadra se ignora', () => {
    const m = entradasDeLaNota(
      `${ENTRADA}; src/a.ts:- MEDIUM→LOW (local·informacion·defensa-en-profundidad); basura`
    )
    expect(m.get('src/theme.css:23')).toEqual([{ modelo: 'LOW', banda: 'HIGH', ejes: 'anonimo·disponibilidad·explotable-hoy' }]) // prettier-ignore
    expect(m.get('src/a.ts:-')?.[0]).toMatchObject({ modelo: 'MEDIUM', banda: 'LOW' })
    expect(m.size).toBe(2)
  })
})

describe('planDeRestauracion: solo lo que cuadra, y la nota mas reciente manda (ADR-103 §3)', () => {
  it('una fila de familia cuya banda coincide con la entrada: se restaura la palabra del modelo', () => {
    const { plan, excluidas } = planDeRestauracion([fila()], [nota(ENTRADA)])
    expect(plan).toEqual([{ id: 'f1', file: 'src/theme.css', line: 23, tipo: 'accesibilidad', title: 'Contraste 4.08:1', de: 'HIGH', a: 'LOW' }]) // prettier-ignore
    expect(excluidas).toEqual([])
  })

  it('banda distinta de la severidad actual: la fila fue tocada despues y no se pisa', () => {
    const { plan } = planDeRestauracion([fila({ severity: 'MEDIUM' })], [nota(ENTRADA)])
    expect(plan).toEqual([])
  })

  it('manda la nota mas reciente aunque venga desordenada', () => {
    const vieja = nota('src/theme.css:23 MEDIUM→HIGH (anonimo·disponibilidad·explotable-hoy)', '2026-09-01T00:00:00Z') // prettier-ignore
    const { plan } = planDeRestauracion([fila()], [vieja, nota(ENTRADA)])
    expect(plan[0]?.a).toBe('LOW')
  })

  it('dos palabras distintas para el mismo sitio en la misma nota: ambigua, no se toca y se lista', () => {
    const { plan, excluidas } = planDeRestauracion([fila()], [nota(`${ENTRADA}; src/theme.css:23 MEDIUM→HIGH (x·y·z)`)]) // prettier-ignore
    expect(plan).toEqual([])
    expect(excluidas).toEqual([{ id: 'f1', razon: 'ambigua' }])
  })

  it('EXTINCT, seguridad y otro quedan fuera aunque la nota los nombre', () => {
    const filas = [fila({ id: 'e', lifecycle: 'EXTINCT' }), fila({ id: 's', tipo: 'cors-permisivo' }), fila({ id: 'o', tipo: 'otro' })] // prettier-ignore
    const { plan, excluidas } = planDeRestauracion(filas, [nota(ENTRADA)])
    expect(plan).toEqual([])
    expect(excluidas.map((e) => e.razon)).toEqual([
      'extinta',
      'no es de auditoria',
      'no es de auditoria'
    ])
  })

  it('sin entrada para el sitio: la fila ya lleva la palabra del modelo, nada que hacer', () => {
    const { plan, excluidas } = planDeRestauracion(
      [fila({ id: 'x', file: 'otro.css' })],
      [nota(ENTRADA)]
    )
    expect(plan).toEqual([])
    expect(excluidas).toEqual([])
  })

  it('es idempotente: tras restaurar, la banda de la entrada ya no coincide y el plan queda vacio', () => {
    const { plan } = planDeRestauracion([fila({ severity: 'LOW' })], [nota(ENTRADA)])
    expect(plan).toEqual([])
  })
})
