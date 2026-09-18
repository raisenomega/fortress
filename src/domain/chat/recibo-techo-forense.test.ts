import { describe, expect, it } from 'vitest'
import { entradaDelRecibo, tacharRecibo, TECHO_FORENSE } from './recibo-de-herramientas'

// `x` y no `a`: una tirada de 32+ caracteres HEX es la forma de un hash, y
// `redactSecrets` la tacha con razon (`tool-detail.ts:38`). Con `a` el relleno
// era un secreto, y estos tests median la redaccion creyendo medir el techo.
const largo = (n: number): string => entradaDelRecibo('Bash', 'x'.repeat(n))

/**
 * ADR-093 §3.2, la otra mitad: COMO se corta. Lo que se tacha vive aparte, en
 * `recibo-de-herramientas.test.ts`.
 */
describe('el techo es forense, no cosmetico', () => {
  it('un comando normal no se toca', () => {
    expect(tacharRecibo([largo(200)])[0]).toHaveLength('Bash: '.length + 200)
  })

  it('al alcanzarlo LO DICE, y dice cuanto habia', () => {
    // La diferencia con `toolDetail`, que corta a 120 y pone '...' mudo: eso se
    // lee como un comando entero cuando no lo es. Misma leccion que
    // `desconocida` en ADR-091 — lo grave no es cortar, es que parezca completo.
    const [linea] = tacharRecibo([largo(TECHO_FORENSE * 2)])

    expect(linea).toContain('CORTADO')
    expect(linea).toContain(String(TECHO_FORENSE))
    expect(linea).not.toMatch(/\.\.\.$/)
  })

  it('el techo esta por encima de cualquier comando real', () => {
    expect(TECHO_FORENSE).toBeGreaterThan(1000)
  })
})

describe('el orden importa: tachar ANTES de cortar', () => {
  it('un secreto justo en el corte no se parte para colarse', () => {
    // Si se cortara primero, la credencial quedaria a medias, no casaria con
    // ningun patron, y se escribiria. Por eso se tacha entera y luego se corta.
    const relleno = 'x'.repeat(TECHO_FORENSE - 10)
    const [linea] = tacharRecibo([`Bash: ${relleno}TOKEN=abc123secreto`])

    expect(linea).not.toContain('abc123secreto')
  })
})
