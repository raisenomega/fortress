import { describe, expect, it } from 'vitest'
import { entradaDelRecibo, tacharRecibo } from './recibo-de-herramientas'

/**
 * ADR-093 §3.4, el innegociable: QUE se tacha. El corte vive aparte, en
 * `recibo-techo-forense.test.ts`: son dos preguntas distintas y juntas no
 * cabian en un fichero.
 */
describe('una linea del recibo', () => {
  it('lleva herramienta y comando', () => {
    expect(entradaDelRecibo('Bash', 'npm ci --no-audit')).toBe('Bash: npm ci --no-audit')
  })

  it('sin detalle es solo el nombre: no se inventa nada', () => {
    expect(entradaDelRecibo('Read')).toBe('Read')
    expect(entradaDelRecibo('Read', '')).toBe('Read')
  })
})

describe('R1: se tacha para TODAS las herramientas, no solo Bash', () => {
  // El corazon del §3.4. Hoy `toolDetail` solo tacha Bash; el resto va en crudo
  // y solo esta a salvo porque el vivo lo envuelve. Lo que se PERSISTE no pasa
  // por ese envoltorio, asi que si alguna de estas colara sin tachar, FORTRESS
  // tendria su primer campo que escribe secretos a disco, y para siempre.
  it('un patron de Grep con un token NO se escribe en claro', () => {
    const [linea] = tacharRecibo([entradaDelRecibo('Grep', 'TOKEN=abc123secreto')])

    expect(linea).toContain('***')
    expect(linea).not.toContain('abc123secreto')
  })

  it('una query de MCP tampoco', () => {
    const [linea] = tacharRecibo([entradaDelRecibo('mcp__x__search', 'TOKEN=abc123secreto')])

    expect(linea).not.toContain('abc123secreto')
  })

  it('y Bash, que ya se tachaba, sigue tachandose', () => {
    const [linea] = tacharRecibo([entradaDelRecibo('Bash', 'echo TOKEN=abc123secreto')])

    expect(linea).not.toContain('abc123secreto')
  })

  it('lo que no es secreto se conserva entero: el recibo tiene que servir', () => {
    expect(tacharRecibo([entradaDelRecibo('Bash', 'npm ci --no-audit --no-fund')])).toEqual([
      'Bash: npm ci --no-audit --no-fund'
    ])
  })
})
