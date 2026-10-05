import { describe, expect, it } from 'vitest'
import { modeloDeLaApi, type CatalogoDeModelos } from './modelo-de-la-api'

/** La API no acepta el alias pelado `opus` como el CLI: exige un id. Para que
 *  el chat siga «subiendo solo» sin clavar un id, el alias se resuelve contra
 *  el catalogo que la propia API publica: el mas nuevo de la familia. */
const catalogo = (...ms: Array<{ id: string; created_at: string }>): CatalogoDeModelos => ({
  list: async function* () {
    for (const m of ms) yield { ...m, display_name: m.id }
  }
})

describe('el alias del SDK se resuelve contra el catalogo de la API', () => {
  it('elige el opus MAS NUEVO, no el primero que aparece', async () => {
    const c = catalogo({ id: 'claude-opus-5', created_at: '2026-02-01T00:00:00Z' }, { id: 'claude-opus-5-5', created_at: '2026-08-01T00:00:00Z' }, { id: 'claude-sonnet-5-5', created_at: '2026-09-01T00:00:00Z' }) // prettier-ignore
    expect((await modeloDeLaApi(c, 'opus'))?.id).toBe('claude-opus-5-5')
  })

  it('nunca resuelve a Fable: ni pidiendolo por su alias (doctrina ADR-088 Enm. 3)', async () => {
    const c = catalogo({ id: 'claude-fable-5-1', created_at: '2026-10-01T00:00:00Z' }, { id: 'claude-opus-5-5', created_at: '2026-08-01T00:00:00Z' }) // prettier-ignore
    expect(await modeloDeLaApi(c, 'fable')).toBeNull()
    expect((await modeloDeLaApi(c, 'opus'))?.id).toBe('claude-opus-5-5')
  })

  it('sin ningun modelo de la familia → null (no se inventa un id fijo de repuesto)', async () => {
    expect(await modeloDeLaApi(catalogo({ id: 'claude-haiku-4-5', created_at: '2026-01-01T00:00:00Z' }), 'opus')).toBeNull() // prettier-ignore
  })
})
