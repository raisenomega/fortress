import { describe, expect, it } from 'vitest'
import { TOOLS_EDICION, TOOLS_LECTURA } from './motor-tools'

/**
 * ADR-111 pieza 2: la pre-aprobacion de npm del generador. La regla va LITERAL
 * aqui a proposito —no importada—: lo que estos tests clavan es la FORMA que la
 * capa de permisos midio el 2026-10-03 (C1-C13), y un mutante que la ablande
 * (`Bash(npm:*)`, un flag menos, algo detras de --ignore-scripts) debe caer
 * contra esta copia, no contra si mismo.
 */
const REGLA = 'Bash(npm install * --package-lock-only --ignore-scripts)'

describe('la pre-aprobacion de npm del generador (ADR-111)', () => {
  it('TOOLS_EDICION lleva UNA SOLA entrada Bash: la forma segura del lock', () => {
    const bash = TOOLS_EDICION.split(',').filter((t) => t.startsWith('Bash'))
    expect(bash).toEqual([REGLA])
  })

  it('la regla exige los DOS flags AL FINAL y no es un prefijo abierto', () => {
    const [bash] = TOOLS_EDICION.split(',').filter((t) => t.startsWith('Bash'))
    expect(bash?.startsWith('Bash(npm install ')).toBe(true)
    // Anclar al final es lo que niega `npm install pkg --ignore-scripts --save-dev`
    // y el encadenado: nada puede venir despues de los flags (medido, C5).
    expect(bash?.endsWith(' --package-lock-only --ignore-scripts)')).toBe(true)
    // Un prefijo `:*` aprobaria el install normal, que recompila nativos y
    // muere en la caja (medido, 2026-10-02). Ese es el mutante.
    expect(bash).not.toContain(':*')
  })

  it('los agentes de LECTURA (analista, critico, OMEGA) siguen sin Bash alguno', () => {
    expect(TOOLS_LECTURA.split(',').some((t) => t.startsWith('Bash'))).toBe(false)
  })
})
