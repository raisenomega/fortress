import { describe, expect, it } from 'vitest'
import { MAX_LINEAS_POR_FICHERO } from '../shared/limite-de-fichero'
import type { Severity } from '../shared/severity'
import { DEFAULT_POLICY, evaluate, type ProposalDiff } from './auto-merge-policy'

const ACTIVA = { ...DEFAULT_POLICY, enabled: true }
const F = 'src/domain/repair/additive.ts'

// prettier-ignore
function fix(lineasPorFichero: Record<string, number>): ProposalDiff {
  return { severity: 'LOW' as Severity, files: [F], insertions: 3, deletions: 1, lineasPorFichero }
}

describe('el cerco no deja main rojo: el tope de lineas es una condicion mas', () => {
  it('un fix que dejaria el fichero en 76 lineas NO se integra solo', () => {
    // El gate mide la propuesta en su worktree y da verde; el arbol integrado
    // no lo mide nadie. Un fix de una linea sobre uno de los diecisiete que
    // hoy estan justo en el tope deja main sin pasar su propio lint.
    const r = evaluate(fix({ [F]: MAX_LINEAS_POR_FICHERO + 1 }), ACTIVA)

    expect(r.allowed).toBe(false)
    expect(r.conditionFailed).toBe('max-lines')
    expect(r.reason).toContain('76')
  })

  it('justo en el tope pasa: 75 es legal, 76 no', () => {
    expect(evaluate(fix({ [F]: MAX_LINEAS_POR_FICHERO }), ACTIVA).allowed).toBe(true)
  })

  it('lo que no se pudo medir no frena: ausente del mapa no es cero ni infinito', () => {
    // `lineasDeFicheros` OMITE el fichero que no se deja leer en vez de
    // contarlo como cero. Inventar un numero aqui seria un veredicto falso en
    // cualquiera de los dos sentidos: bloquear un fix sano o dejar pasar uno malo.
    expect(evaluate(fix({}), ACTIVA).allowed).toBe(true)
    expect(evaluate(fix({ 'otro.ts': 900 }), ACTIVA).allowed).toBe(true)
  })

  it('no-regresion: las cinco condiciones anteriores siguen decidiendo primero', () => {
    const gordo = { ...fix({ [F]: 200 }), severity: 'HIGH' as Severity }
    expect(evaluate(gordo, ACTIVA).conditionFailed).toBe('severity')
  })
})
