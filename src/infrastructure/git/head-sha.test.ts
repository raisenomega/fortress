import { afterEach, describe, expect, it, vi } from 'vitest'
import { headSha, headShaEnv } from './head-sha'

/**
 * El catch devuelve null ante CUALQUIER fallo: un entorno mal compuesto no
 * rompe ruidosamente, deja informes y propuestas sin ancla en silencio. Por
 * eso aqui se fija que con la lista blanca el sha sigue saliendo de un repo
 * real, y que el null queda para lo que de verdad no es un repo.
 */
describe('headSha con el entorno en lista blanca', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('de un repo real sale un sha, no el null del catch', () => {
    expect(headSha(process.cwd())).toMatch(/^[0-9a-f]{40}$/)
  })

  it('un directorio que no es repo devuelve null, no lanza', () => {
    expect(headSha('/no/existe/este/repo')).toBeNull()
  })

  it('un GIT_DIR sembrado en el operador no desvia el rev-parse', () => {
    vi.stubEnv('GIT_DIR', '/no/existe/otro/repo')
    expect(headSha(process.cwd())).toMatch(/^[0-9a-f]{40}$/)
  })

  it('fija el conjunto EXACTO de claves: ni tokens ni GIT_* heredadas', () => {
    const sembradas: Record<string, string | undefined> = {
      PATH: '/bin',
      HOME: '/home/x',
      LANG: 'C',
      TMPDIR: undefined,
      LC_ALL: undefined,
      GITHUB_TOKEN: 'secreto',
      ANTHROPIC_API_KEY: 'secreto',
      GIT_DIR: '/otro',
      GIT_CONFIG_PARAMETERS: "'core.pager=x'",
      SSH_AUTH_SOCK: '/tmp/agent'
    }
    for (const [clave, valor] of Object.entries(sembradas)) vi.stubEnv(clave, valor)
    const env = headShaEnv()
    expect(Object.keys(env).sort()).toEqual(['GIT_TERMINAL_PROMPT', 'HOME', 'LANG', 'PATH'])
    expect(env.GIT_TERMINAL_PROMPT).toBe('0')
    expect(env.PATH).toBe('/bin')
  })

  it('el PATH se lee en la llamada, no al cargar el modulo', () => {
    vi.stubEnv('PATH', `${process.env.PATH ?? ''}:/ruta/de/augment`)
    expect(headShaEnv().PATH).toMatch(/:\/ruta\/de\/augment$/)
  })
})
