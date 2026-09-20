import { describe, expect, it } from 'vitest'
import { claudeModeArg } from '@domain/settings/permission-mode'
import { buildAllowedTools } from '../claude-code/build-allowed-tools'

const SCRIPTS = ['typecheck', 'lint', 'test']

/**
 * Los dos modos que corren en `default` piden cosas OPUESTAS de Bash, y por eso
 * son dos y no uno. Fundirlos deshace una de las dos piezas.
 */
describe('los dos modos de lectura NO se fundieron', () => {
  it('la aplicabilidad sigue SIN Bash: alli ejecutar esta prohibido', () => {
    // `lectura` es del clasificador de alcance, cuyo prompt dice «no edites ni
    // ejecutes nada». Darle Bash desharia la pieza 1.
    expect(buildAllowedTools('lectura', true, SCRIPTS)).not.toContain('Bash')
  })

  it('pero los dos ven el grafo: es lo que compartian y lo que les faltaba', () => {
    for (const modo of ['lectura', 'auditoria'] as const) {
      expect(claudeModeArg(modo)).toBe('default')
      expect(buildAllowedTools(modo, false, SCRIPTS).some((t) => t.includes('search_graph'))).toBe(true) // prettier-ignore
    }
  })
})
