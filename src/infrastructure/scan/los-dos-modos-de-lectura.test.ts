import { describe, expect, it } from 'vitest'
import { claudeModeArg } from '@domain/settings/permission-mode'
import { buildAllowedTools, buildDisallowedTools } from '../claude-code/build-allowed-tools'

const SCRIPTS = ['typecheck', 'lint', 'test']

/**
 * Los dos modos que corren en `default` piden cosas OPUESTAS de Bash, y por eso
 * son dos y no uno. Fundirlos deshace una de las dos piezas.
 */
describe('los dos modos de lectura NO se fundieron', () => {
  it('a lectura se le QUITA Bash, que es lo unico que de verdad lo impide', () => {
    // El nombre viejo de este test decia «sigue SIN Bash» y solo miraba el
    // allowlist — donde Bash nunca estuvo y aun asi corria. Lo que lo impide es
    // `--disallowedTools`, medido el 2026-09-20: «NO_PUDE_BASH».
    expect(buildDisallowedTools('lectura', true)).toContain('Bash')
  })

  it('y auditoria NO lo lleva: el escaner vive de ejecutar', () => {
    expect(buildDisallowedTools('auditoria', true)).toEqual([])
  })

  it('no estar en el allowlist NO basta: los dos lo omiten y solo uno lo impide', () => {
    // La premisa falsa que arrastraba el repo, fijada como test para que no
    // vuelva: omitir una herramienta de `--allowedTools` no la bloquea.
    for (const modo of ['lectura', 'auditoria'] as const) {
      expect(buildAllowedTools(modo, true, SCRIPTS).includes('Bash')).toBe(modo === 'auditoria')
    }
  })

  it('pero los dos ven el grafo: es lo que compartian y lo que les faltaba', () => {
    for (const modo of ['lectura', 'auditoria'] as const) {
      expect(claudeModeArg(modo)).toBe('default')
      expect(buildAllowedTools(modo, false, SCRIPTS).some((t) => t.includes('search_graph'))).toBe(true) // prettier-ignore
    }
  })
})
