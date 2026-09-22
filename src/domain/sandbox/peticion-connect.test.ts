import { describe, expect, it } from 'vitest'
import { leerConnect, permitido } from './peticion-connect'

const LISTA = ['registry.npmjs.org']

describe('el proxy solo entiende CONNECT, y solo deja pasar la lista por 443', () => {
  it('lee un CONNECT normal', () => {
    expect(leerConnect('CONNECT registry.npmjs.org:443 HTTP/1.1\r\nHost: x\r\n\r\n')).toEqual({ host: 'registry.npmjs.org', puerto: 443 }) // prettier-ignore
  })

  it('el host baja a minusculas: es como funciona un nombre', () => {
    expect(leerConnect('CONNECT Registry.NPMJS.org:443 HTTP/1.1\r\n')?.host).toBe(
      'registry.npmjs.org'
    )
  })

  it.each([
    'GET http://registry.npmjs.org/ HTTP/1.1\r\n',
    'CONNECT registry.npmjs.org HTTP/1.1\r\n',
    'CONNECT registry.npmjs.org:443\r\n',
    'CONNECT [::1]:443 HTTP/1.1\r\n',
    'CONNECT user@registry.npmjs.org:443 HTTP/1.1\r\n',
    'CONNECT registry.npmjs.org:0 HTTP/1.1\r\n',
    'CONNECT registry.npmjs.org:70000 HTTP/1.1\r\n',
    'CONNECT registry.npmjs.org:443 HTTP/1.1',
    ''
  ])('«%s» no es un CONNECT que se pueda atender', (linea) => {
    expect(leerConnect(linea)).toBeNull()
  })

  it('un GET con la misma forma que un CONNECT tampoco entra: solo el verbo CONNECT', () => {
    expect(leerConnect('GET registry.npmjs.org:443 HTTP/1.1\r\n')).toBeNull()
  })

  it('el host se casa ENTERO: un sufijo igual no es el mismo host', () => {
    expect(permitido({ host: 'evil-registry.npmjs.org', puerto: 443 }, LISTA)).toBe(false)
    expect(permitido({ host: 'registry.npmjs.org.evil.com', puerto: 443 }, LISTA)).toBe(false)
  })

  it('pasa la lista por 443; cualquier otro puerto o host, no', () => {
    expect(permitido({ host: 'registry.npmjs.org', puerto: 443 }, LISTA)).toBe(true)
    expect(permitido({ host: 'registry.npmjs.org', puerto: 80 }, LISTA)).toBe(false)
    expect(permitido({ host: 'registry.npmjs.org', puerto: 8443 }, LISTA)).toBe(false)
    expect(permitido({ host: 'example.com', puerto: 443 }, LISTA)).toBe(false)
    expect(permitido({ host: 'registry.npmjs.org', puerto: 443 }, [])).toBe(false)
  })
})
