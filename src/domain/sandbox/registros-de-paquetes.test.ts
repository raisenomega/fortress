import { describe, expect, it } from 'vitest'
import { BY_FILE } from '../project/stack'
import { REGISTROS_DE_PAQUETES, ecosistemasDe, esRegistro, registrosDe } from './registros-de-paquetes' // prettier-ignore

describe('la red de la caja: solo registros de paquetes, y la lista es cerrada', () => {
  it('cada ecosistema que FORTRESS detecta tiene su registro, y ninguno de mas', () => {
    const detectados = [...new Set(BY_FILE.map(([, etiqueta]) => etiqueta))].sort()
    expect(Object.keys(REGISTROS_DE_PAQUETES).sort()).toEqual(detectados)
  })

  it('un proyecto Node abre el registro de npm y nada mas', () => {
    expect(registrosDe(['Node.js'])).toEqual(['registry.npmjs.org'])
  })

  it('sin ecosistema reconocido la red queda CERRADA: lista vacia, no «todos»', () => {
    expect(registrosDe([])).toEqual([])
  })

  it('dos ecosistemas suman, sin repetir', () => {
    const hosts = registrosDe(['Node.js', 'Python', 'Node.js'])
    expect(hosts).toEqual(['files.pythonhosted.org', 'pypi.org', 'registry.npmjs.org'])
  })

  it('el ecosistema sale de los MANIFIESTOS presentes, no de una etiqueta bonita', () => {
    expect(ecosistemasDe(['package.json', 'README.md', 'Cargo.toml'])).toEqual(['Node.js', 'Rust'])
    expect(ecosistemasDe(['README.md'])).toEqual([])
  })

  it.each([
    'registry.npmjs.org.evil.com',
    'evil-registry.npmjs.org',
    'xregistry.npmjs.org',
    'registry.npmjs.org:8443',
    'user@registry.npmjs.org',
    '104.16.0.35',
    ''
  ])('«%s» NO es un registro: se casa el host entero, sin comodines', (host) => {
    expect(esRegistro(host)).toBe(false)
  })

  it('casa sin distinguir mayusculas, que es como funciona un host', () => {
    expect(esRegistro('Registry.NPMJS.org')).toBe(true)
  })

  it('la tabla no se puede ensanchar en caliente', () => {
    const tabla = REGISTROS_DE_PAQUETES as unknown as Record<string, string[]>
    expect(() => tabla['Node.js'].push('evil.com')).toThrow()
    expect(() => (tabla['Malo'] = ['evil.com'])).toThrow()
  })
})
