import { describe, expect, it } from 'vitest'
import { caja } from './caja-fixture'
import { flagsDeBwrap } from './flags-de-bwrap'

/**
 * La cota de anchura de ADR-092 se aplica a TODAS las rutas que se montan en su
 * propio sitio, y el socket del proxy es una de ellas. Cuando NO hay red no hay
 * socket, y donde antes iba un `/` de relleno —inocuo mientras la cota solo
 * mirase el proyecto— ahora estaria la ruta mas ancha que existe.
 *
 * Este test existe porque el fallo seria silencioso y total: sin red es el camino
 * por DEFECTO del motor, asi que la caja dejaria de levantarse entera y el
 * mensaje diria «ruta demasiado ancha» de una ruta que nadie pidio montar.
 */
describe('una caja sin red se levanta igual', () => {
  it('el socket ausente no es una ruta: no pasa por la cota', () => {
    const r = flagsDeBwrap(caja({ socketDelProxy: null }))
    expect(r.ok).toBe(true)
  })

  it('con socket, su ruta si pasa por la cota', () => {
    const ancho = flagsDeBwrap(caja({ socketDelProxy: '/home/ana' }))
    expect(ancho).toEqual({ ok: false, error: 'ruta-demasiado-ancha' })
    const bueno = flagsDeBwrap(caja({ socketDelProxy: '/tmp/fortress-proxy-abc/p.sock' }))
    expect(bueno.ok).toBe(true)
  })
})
