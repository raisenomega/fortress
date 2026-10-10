import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { bloqueCtoKit, CABECERA_DEL_KIT } from '@domain/build/bloque-cto-kit'
import { marcoDeHallazgos } from '@domain/build/marcos-del-libro'
import type { Finding } from '@domain/project/finding'
import { buildAllowedTools, buildDisallowedTools } from '../claude-code/build-allowed-tools'

/**
 * (c) del Sello B.1: la rebanada del libro entra como TEXTO bajo la cabecera
 * de subordinacion, por el MISMO sitio que el cto-kit — y leer contexto no le
 * da al agente ninguna herramienta nueva.
 */
const src = readFileSync('src/infrastructure/build/run-cto.ts', 'utf8')

describe('LA REBANADA ENTRA COMO DATO bajo la cabecera', () => {
  it('run-cto compone kit + rebanada en el MISMO bloque subordinado', () => {
    expect(src).toContain('bloqueCtoKit([...leerCtoKit(), ...marcos])')
    expect(src).toContain('rebanadaDelLibro(context, proyectoAncla)')
  })

  it('sin ancla NO se lee nada: el CTO global de siempre', () => {
    expect(src).toContain('proyectoAncla === null ? []')
  })

  it('la cabecera precede al marco: el dato se consulta, no manda', () => {
    const marco = marcoDeHallazgos([
      { severity: 'HIGH', title: 'x', file: 'a.ts', line: 1 } as Finding
    ])
    const bloque = bloqueCtoKit([marco])
    expect(bloque.indexOf(CABECERA_DEL_KIT)).toBe(0)
    expect(bloque).toContain('=== MARCO: hallazgos-vivos ===')
  })
})

describe('EL CANDADO NO SE MUEVE: leer contexto no da herramienta', () => {
  it("la allowlist sigue ['WebSearch'] exacto y Bash sigue quitado", () => {
    expect(buildAllowedTools('libre', false, [])).toEqual(['WebSearch'])
    expect(buildDisallowedTools('libre', true)).toEqual(['Bash'])
  })
})
