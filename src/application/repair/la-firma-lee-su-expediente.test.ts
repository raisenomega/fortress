import { describe, expect, it } from 'vitest'
import { MOTIVO_CORREA } from '@domain/repair/lo-que-el-motor-supo'
import { MOTIVO_HUELLA } from '@domain/repair/motivo-de-la-huella'
import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'
import { collectPostOmegaState } from './collect-post-omega-state'
import { cadenaCompleta, evento } from './collect-post-omega-fixture'

/**
 * LA FIRMA NO PODIA LEER SU PROPIO EXPEDIENTE (DEUDAS §13).
 *
 * `collectPostOmegaState` buscaba `branch` y `baseSha` en el ULTIMO
 * `GENERATE DECISION`, dando por hecho que seria el del worktree. Dos arcos
 * BUENOS le pusieron asientos detras —la correa en el libro el 28-sep
 * (`SCOPE`) y la huella del trabajo el 30-sep (`HUELLA`)— y desde entonces el
 * ultimo era otro, sin `branch`: el expediente salia `null` y la firma
 * contestaba `incomplete-state`. Nadie lo vio en once dias porque el gate
 * estaba ciego y ninguna propuesta llegaba a OMEGA.
 *
 * El arreglo es el patron de siempre: el asiento se busca por lo que ES —su
 * motivo— y no por su POSICION.
 */
const conAsientosDetras = (): ReturnType<typeof cadenaCompleta> => {
  const cadena = cadenaCompleta()
  // Exactamente el orden del libro real de la propuesta 7998aa13.
  cadena.splice(1, 0, evento('GENERATE', 'DECISION', { huella: 'abc123', turnos: 14, gasto: 25_977 }, { reason: MOTIVO_HUELLA })) // prettier-ignore
  cadena.splice(2, 0, evento('GENERATE', 'DECISION', { allowed: ['src/a.ts'], allows: [] }, { reason: MOTIVO_CORREA })) // prettier-ignore
  return cadena
}

describe('el expediente se arma buscando el asiento, no el ultimo', () => {
  it('con HUELLA y SCOPE detras, encuentra branch y baseSha del worktree', () => {
    const state = collectPostOmegaState(conAsientosDetras())

    expect(state).not.toBeNull()
    expect({ branch: state?.branch, baseSha: state?.baseSha }).toEqual({
      branch: 'repair/p-1-slug',
      baseSha: 'base123'
    })
  })

  /** Las propuestas de antes del 28-sep tienen UN solo DECISION: siguen valiendo. */
  it('y con el worktree como unico DECISION, sigue funcionando', () => {
    const state = collectPostOmegaState(cadenaCompleta())

    expect(state?.branch).toBe('repair/p-1-slug')
    expect(state?.commitSha).toBe('fix9876')
  })

  /**
   * Lo que el fixture callaba y la realidad no: el asiento del worktree LLEVA
   * su motivo. Sin el, un libro real no se distingue de otro, y es justo lo que
   * dejo pasar la regresion.
   */
  it('el asiento del worktree se reconoce por su motivo', () => {
    const sinMotivo = cadenaCompleta().map((e) =>
      e.phase === 'GENERATE' && e.eventType === 'DECISION' ? { ...e, reason: undefined } : e
    )

    expect(collectPostOmegaState(sinMotivo)).toBeNull()
  })

  it('un motivo que no es el del worktree no se confunde con el', () => {
    expect(MOTIVO_WORKTREE).toBe('WORKTREE_CREATE')
    expect([MOTIVO_CORREA, MOTIVO_HUELLA]).not.toContain(MOTIVO_WORKTREE)
  })
})
