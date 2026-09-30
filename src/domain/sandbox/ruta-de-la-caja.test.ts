import { describe, expect, it } from 'vitest'
import { dentroDe, porQueNoSeMonta, rutaLimpia } from './ruta-de-la-caja'

const rutas = (over = {}): Parameters<typeof porQueNoSeMonta>[0] => ({
  proyecto: '/home/ana/p',
  cwd: '/home/ana/p',
  home: '/home/ana',
  otras: [],
  ...over
})

describe('que se puede montar en la caja', () => {
  it('«dentro de» va por segmentos: /home/ana2 NO esta dentro de /home/ana', () => {
    expect(dentroDe('/home/ana', '/home/ana2')).toBe(false)
    expect(dentroDe('/home/ana', '/home/ana/p')).toBe(true)
    expect(dentroDe('/home/ana', '/home/ana')).toBe(true)
  })

  it('un proyecto vecino del HOME por el nombre se monta sin problema', () => {
    expect(porQueNoSeMonta(rutas({ proyecto: '/home/an/p', cwd: '/home/an/p' }))).toBeNull()
  })

  it('un `..` en medio no es una ruta limpia: bwrap la resolveria a otro sitio', () => {
    expect(rutaLimpia('/home/ana/p/../../.ssh')).toBe(false)
    expect(porQueNoSeMonta(rutas({ otras: ['/usr/../home/ana'] }))).toBe('ruta-no-absoluta-o-sucia')
  })

  it('dice POR QUE, que es lo que el recibo necesita', () => {
    const ancho = porQueNoSeMonta(rutas({ proyecto: '/home', cwd: '/home' }))
    expect(ancho).toBe('proyecto-demasiado-ancho')
    expect(porQueNoSeMonta(rutas({ cwd: '/home/ana/otro' }))).toBe('cwd-fuera-del-proyecto')
  })

  /**
   * La anchura no es solo cosa del proyecto. Medido el 2026-09-29 con un bwrap
   * real: una ruta de las LISTAS que contenga el HOME se monta con `--bind`
   * DESPUES del `--tmpfs` que lo tapa, y el `--bind` gana — el proceso de dentro
   * listaba el HOME entero, leia un testigo y dejaba un fichero en el disco de
   * verdad, fuera de la caja. No lo contiene bwrap: lo tiene que negar la cota.
   */
  it('una ruta de las listas que CONTIENE el HOME no se monta', () => {
    expect(porQueNoSeMonta(rutas({ otras: ['/home/ana'] }))).toBe('ruta-demasiado-ancha')
    expect(porQueNoSeMonta(rutas({ otras: ['/home'] }))).toBe('ruta-demasiado-ancha')
    expect(porQueNoSeMonta(rutas({ otras: ['/'] }))).toBe('ruta-demasiado-ancha')
  })

  it('las rutas legitimas de las listas pasan: ninguna contiene el HOME', () => {
    // Las tres reales, medidas sobre el worktree vivo del motor: el `.git` comun
    // del repo, el destino del `worktree add` en userData, y el node del PATH
    // —que vive DENTRO del HOME y por eso «no leer el home» nunca fue literal—.
    const legitimas = [
      '/home/ana/repos/tienda/.git',
      '/home/ana/.config/app/repair-worktrees/ca8f8770',
      '/home/ana/.nvm/versions/node/v24.18.0',
      '/usr'
    ]
    expect(porQueNoSeMonta(rutas({ otras: legitimas }))).toBeNull()
  })
})
