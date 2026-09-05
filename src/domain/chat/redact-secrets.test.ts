import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/** Los que ESCAPABAN por el `\b`: medidos uno a uno antes de arreglarlo. */
const ESCAPABAN = [
  'GITHUB_TOKEN=ghp_abcdefghijklmnopqrst',
  'export GH_TOKEN=ghs_xyz1234567890abcdef',
  'MI_SECRET=hunter2',
  'npm_config_token=npm_aaaa',
  'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI'
]

/** Texto legitimo que una version amplia destrozaria. Tachar de mas deja un
 *  comando ilegible, que es su propio fallo: no se puede auditar lo que no se ve. */
const LEGITIMO = [
  'el monkey=banana del zoo',
  'donkey=burro',
  'turkey: pavo',
  'ver el keyboard=usb',
  "grep -rn 'foo' src",
  'npm test -- --reporter=verbose'
]

describe('redactSecrets tacha por NOMBRE de variable, no solo por patron', () => {
  it.each(ESCAPABAN)('%s ya no escapa', (linea) => {
    const valor = linea.split('=')[1]

    expect(redactSecrets(linea)).not.toContain(valor)
  })

  it('el prefijo no rompe la deteccion: es lo que fallaba', () => {
    // `\b` no existe entre `_` y `T`, asi que ningun PREFIJO_TOKEN casaba.
    expect(redactSecrets('GITHUB_TOKEN=ghp_abcdefghijklmnopqrst')).toBe('GITHUB_***')
  })

  it('la key de Anthropic se tacha por su NOMBRE, no de casualidad', () => {
    // Antes solo la salvaba el patron `sk-ant-`; con otro formato se filtraba.
    expect(redactSecrets('ANTHROPIC_API_KEY=lo-que-sea-1234')).toBe('ANTHROPIC_***')
  })
})

describe('y NO tacha de mas', () => {
  it.each(LEGITIMO)('%s queda intacto', (texto) => {
    expect(redactSecrets(texto)).toBe(texto)
  })
})

describe('los patrones de valor siguen, para los que viajan sin nombre', () => {
  it.each([
    ['sk-ant-abc123def456', 'sk-ant'],
    ['ghp_abcdefghijklmnopqrst', 'ghp_'],
    ['github_pat_11ABCDEFG0abcdefghijklmnop', 'github_pat_'],
    ['Authorization: Bearer tok_secreto', 'tok_secreto']
  ])('%s se tacha suelto', (linea, rastro) => {
    expect(redactSecrets(linea)).not.toContain(rastro)
  })
})
