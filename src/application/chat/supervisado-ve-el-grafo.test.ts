import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { claudeModeArg, permissionModeFor } from '@domain/settings/permission-mode'
import { buildAllowedTools, buildDisallowedTools } from '../../infrastructure/claude-code/build-allowed-tools' // prettier-ignore

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')
const MODO = permissionModeFor('supervisado')

/**
 * Pieza 3 del bug 2, y la mas ancha: `permissionModeFor('supervisado')` gobierna
 * los DOS caminos del chat —el turno (`reply-from-chat`) y el workflow
 * (`run-workflow`)—. En `plan` el MCP estaba muerto en los dos: «FORTRESS le
 * nego `index_status` al agente en modo supervisado» (obs [24] del backlog).
 */
describe('el chat supervisado ve el grafo', () => {
  it('corre en auditoria, no en plan', () => {
    expect(MODO).toBe('auditoria')
  })

  it('y auditoria es «default»: ahi el MCP SI responde', () => {
    expect(claudeModeArg(MODO)).toBe('default')
    expect(claudeModeArg('plan')).toBe('plan')
  })

  it('el grafo entra en su allowlist', () => {
    expect(buildAllowedTools(MODO, false, []).some((t) => t.includes('search_graph'))).toBe(true)
  })
})

describe('y NO gana nada que no tuviera', () => {
  it('sigue sin Write ni Edit: la garantia del interruptor, intacta', () => {
    // No la sostiene el modo: la sostienen `Write`/`Edit` al pedir permiso, que
    // en headless nadie concede (medido 2026-09-20, con fila en denials).
    for (const trusted of [true, false]) {
      expect(buildAllowedTools(MODO, trusted, ['lint']).some((t) => /Write|Edit/.test(t))).toBe(false) // prettier-ignore
    }
    expect(permissionModeFor('supervisado')).not.toBe('acceptEdits')
  })

  it('conserva Bash: no se le quita, como si se le quita a lectura', () => {
    // El chat investiga ejecutando. `lectura` es otra cosa: alli el contrato
    // dice «no ejecutes» y por eso ese modo SI lo quita.
    expect(buildDisallowedTools(MODO, true)).toEqual([])
    expect(buildDisallowedTools('lectura', true)).toContain('Bash')
  })
})

describe('lo que esta pieza NO toca', () => {
  it('el turno de plan del lote conserva su excepcion: sigue en lectura', () => {
    expect(fuente('src/application/chat/reply-from-chat.ts')).toMatch(
      /esTurnoDePlanDelLote\(options\) \? 'lectura' : permissionModeFor\(mode\)/
    )
  })

  it('la aprobacion del operador sigue gateando el ENVIO, no la edicion', () => {
    // Por eso el supervisado nunca edito: el humano aprueba antes de que el
    // turno salga, y el turno corre sin poder escribir.
    expect(fuente('src/presentation/services/puerta-del-envio.ts')).toMatch(
      /if \(envio\.mode === 'supervisado' && !configuring\) useWorkflowStore\.getState\(\)\.setPending\(prompt\)/
    )
  })

  it('el autonomo sigue editando: el interruptor sigue significando algo', () => {
    expect(permissionModeFor('autonomo')).toBe('acceptEdits')
  })
})
