import { describe, expect, it } from 'vitest'
import { reidentificarHallazgos } from './reidentificar-hallazgos'
import { baseConHallazgos, vivas, type Sembrada } from './reidentificar-fixture'

/**
 * La aritmetica que el inventario del 2026-09-11 PREDIJO sobre la base real,
 * reproducida aqui con la misma forma. Si el backfill colapsara de mas o de
 * menos, estos numeros dejarian de salir — y son los que el ADR-084 firma.
 */

/** Los 19 sitios duplicados de Health Flow: 12 donde solo bailo el SIMBOLO
 *  —uno de ellos con TRES filas, `auth-guides.md:262`— y 7 donde bailo el TIPO. */
const HEALTH_FLOW: Sembrada[] = [
  ...Array.from({ length: 11 }, (_, i): Sembrada[] => [
    { file: `s${i}.ts`, line: 10, tipo: 'secreto-versionado', simbolo: '' },
    { file: `s${i}.ts`, line: 10, tipo: 'secreto-versionado', simbolo: `SIMB_${i}` }
  ]).flat(),
  { file: 'docs/auth-guides.md', line: 262, tipo: 'secreto-versionado', simbolo: '' },
  { file: 'docs/auth-guides.md', line: 262, tipo: 'secreto-versionado', simbolo: 'Configuracion' },
  { file: 'docs/auth-guides.md', line: 262, tipo: 'secreto-versionado', simbolo: 'Variables' },
  ...Array.from({ length: 7 }, (_, i): Sembrada[] => [
    { file: `t${i}.ts`, line: 20, tipo: 'autorizacion-ausente', simbolo: 'getHistory' },
    { file: `t${i}.ts`, line: 20, tipo: 'control-evadible', simbolo: 'getHistory' }
  ]).flat()
]

/** FORTRESS: 54 filas post-ADR-081, todas en sitios distintos. */
const FORTRESS: Sembrada[] = Array.from({ length: 54 }, (_, i) => ({
  file: `src/f${i}.ts`,
  line: i + 1,
  tipo: 'otro',
  simbolo: `s${i}`
}))

describe('la aritmetica predicha se cumple', () => {
  it('Health Flow: 39 filas en 19 sitios -> colapsa 13, no 20', () => {
    // 13 y no 20 porque los 7 sitios donde bailo el TIPO sobreviven separados,
    // que es exactamente lo que se decidio al conservar el tipo en la clave.
    const { db } = baseConHallazgos(HEALTH_FLOW)
    expect(vivas(db)).toBe(39)

    expect(reidentificarHallazgos(db)).toEqual({ reescritas: 39, absorbidas: 13 })
    expect(vivas(db)).toBe(26)
  })

  it('y los 7 del baile del TIPO siguen ahi, dos filas cada uno', () => {
    const { db } = baseConHallazgos(HEALTH_FLOW)
    reidentificarHallazgos(db)

    const porTipo = db.prepare(`SELECT tipo, COUNT(*) n FROM findings
      WHERE lifecycle != 'EXTINCT' AND file LIKE 't%' GROUP BY tipo ORDER BY tipo`).all() // prettier-ignore
    expect(porTipo).toEqual([
      { tipo: 'autorizacion-ausente', n: 7 },
      { tipo: 'control-evadible', n: 7 }
    ])
  })

  it('FORTRESS: 54 filas -> colapsa CERO, nuestro corpus ya estaba limpio', () => {
    const { db } = baseConHallazgos(FORTRESS)

    expect(reidentificarHallazgos(db)).toEqual({ reescritas: 54, absorbidas: 0 })
    expect(vivas(db)).toBe(54)
  })
})
