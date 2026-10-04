import { describe, expect, it } from 'vitest'
import { headSha } from './head-sha'

/**
 * El catch devuelve null ante CUALQUIER fallo: un entorno mal compuesto no
 * rompe ruidosamente, deja informes y propuestas sin ancla en silencio. Por
 * eso aqui se fija que con el entorno acotado de gitEnv el sha sigue saliendo
 * de un repo real, y que el null queda para lo que de verdad no es un repo.
 */
describe('headSha con el entorno acotado', () => {
  it('de un repo real sale un sha, no el null del catch', () => {
    expect(headSha(process.cwd())).toMatch(/^[0-9a-f]{40}$/)
  })

  it('un directorio que no es repo devuelve null, no lanza', () => {
    expect(headSha('/no/existe/este/repo')).toBeNull()
  })
})
