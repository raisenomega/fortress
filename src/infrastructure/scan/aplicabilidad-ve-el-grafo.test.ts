import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { buildAllowedTools } from '../claude-code/build-allowed-tools'
import { claudeModeArg } from '@domain/settings/permission-mode'
import { crearJuez } from './juez-de-aplicabilidad'

const BLOQUE = 'APLICA:[{"modulo":"M8","aplica":"no","porque":"billing-mode.ts:12"}]:END-APLICA'

/** El juez con la peticion que salio al CLI a la vista. */
async function pedido(): Promise<CodeAgentRequest> {
  const pedidos: CodeAgentRequest[] = []
  const cli: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (p) => (pedidos.push(p), Promise.resolve({ text: BLOQUE, failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] })) // prettier-ignore
  }
  await crearJuez(cli, 'p1')('/proyecto', ['M8'], ['apps', 'services'])
  return pedidos[0] as CodeAgentRequest
}

/**
 * La señal nº1 del backlog de Auto-mejora: `plan` BLOQUEA todo el MCP, asi que
 * el clasificador de alcance decidia sin poder mirar el grafo. Lo anoto el
 * propio agente —«no se pudo ni comprobar si el proyecto estaba indexado»— y se
 * repitio en CUATRO proyectos distintos.
 */
describe('la aplicabilidad ve el grafo', () => {
  it('corre en lectura, no en plan', async () => {
    expect((await pedido()).permissionMode).toBe('lectura')
  })

  it('y lectura es «default» para el CLI: ahi el MCP SI responde', () => {
    expect(claudeModeArg('lectura')).toBe('default')
    expect(claudeModeArg('plan')).toBe('plan')
  })

  it('su allowlist trae el grafo Y la lectura de ficheros que necesita citar', () => {
    // Su contrato exige `fichero.ext:linea` en cada veredicto: sin Read/Glob no
    // podria respaldar ni un descarte.
    const tools = buildAllowedTools('lectura', false, [])

    expect(tools).toContain('Read')
    expect(tools).toContain('Glob')
    expect(tools.some((t) => t.includes('search_graph'))).toBe(true)
  })
})

describe('clasificar sigue siendo MIRAR', () => {
  it('sin Write, Edit ni Bash: la regla la sostiene la herramienta', () => {
    // El prompt ya pedia «no edites ni ejecutes nada», pero en `plan` eso era
    // una peticion con Bash a mano. Ahora no esta en la lista.
    const tools = buildAllowedTools('lectura', false, ['typecheck', 'lint'])

    expect(tools.some((t) => /Write|Edit|Bash/.test(t))).toBe(false)
  })

  it('y no se autoverifica: `trusted: false` aunque el proyecto sea de fiar', async () => {
    expect((await pedido()).trusted).toBe(false)
  })

  it('el prompt sigue prohibiendo ejecutar: las dos mitades dicen lo mismo', () => {
    const prompt = readFileSync('src/domain/scan/juicio-prompt.ts', 'utf8')

    expect(prompt).toContain('No edites ni ejecutes nada')
  })
})
