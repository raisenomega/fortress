import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

const NO_AGENTS = {}
const AGENTS = { 'security-reviewer': { description: 'Audita', prompt: 'Eres el auditor' } }

/** Sin agentes ni despacho: la forma minima. */
const args = (prompt = 'hola', mode: 'plan' | 'acceptEdits' = 'plan'): string[] =>
  buildArgs(prompt, mode, NO_AGENTS, null)

/**
 * Estos argumentos se verificaron contra `claude --help` de la version 2.1.220.
 * La spec original pedia `--headless --project <ruta>`: ninguno de los dos
 * existe, y usarlos hacia fallar cada ejecucion.
 */
describe('buildArgs', () => {
  it('usa -p, que es el flag no interactivo real', () => {
    expect(args()).toContain('-p')
  })

  it('no usa --headless ni --project: no existen', () => {
    expect(args()).not.toContain('--headless')
    expect(args().join(' ')).not.toContain('--project')
  })

  it('pasa el prompt justo despues de -p', () => {
    const built = args('revisa la seguridad')
    expect(built[built.indexOf('-p') + 1]).toBe('revisa la seguridad')
  })

  it('pide stream-json con verbose, que es lo que emite los eventos', () => {
    expect(args()[args().indexOf('--output-format') + 1]).toBe('stream-json')
    expect(args()).toContain('--verbose')
  })

  it('traslada el modo de permisos al CLI', () => {
    const plan = args('hola', 'plan')
    const edits = args('hola', 'acceptEdits')
    expect(plan[plan.indexOf('--permission-mode') + 1]).toBe('plan')
    expect(edits[edits.indexOf('--permission-mode') + 1]).toBe('acceptEdits')
  })

  it('siempre pone un tope de gasto: sin el, un repo enorme no se detiene', () => {
    const built = args()
    expect(built[built.indexOf('--max-budget-usd') + 1]).toBe('3')
  })

  it('nunca salta las comprobaciones de permisos', () => {
    expect(args('hola', 'acceptEdits').join(' ')).not.toContain('dangerously-skip-permissions')
  })
})

describe('buildArgs con agentes', () => {
  it('inyecta las definiciones como JSON', () => {
    const built = buildArgs('hola', 'plan', AGENTS, null)
    const json = built[built.indexOf('--agents') + 1]
    expect(JSON.parse(json)['security-reviewer'].prompt).toBe('Eres el auditor')
  })

  it('despacha en el agente elegido', () => {
    const built = buildArgs('hola', 'plan', AGENTS, 'security-reviewer')
    expect(built[built.indexOf('--agent') + 1]).toBe('security-reviewer')
  })

  it('omite --agents si el proyecto ya define los suyos', () => {
    expect(buildArgs('hola', 'plan', NO_AGENTS, null)).not.toContain('--agents')
  })

  it('sin agente enrutado no fuerza ninguno', () => {
    expect(buildArgs('hola', 'plan', AGENTS, null)).not.toContain('--agent')
  })
})
