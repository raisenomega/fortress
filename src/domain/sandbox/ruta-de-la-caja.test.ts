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
})
