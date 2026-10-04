import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

const NO_AGENTS = {} // sin agentes ni despacho: la forma minima
const args = (prompt = 'hola', mode: 'plan' | 'acceptEdits' = 'plan'): readonly string[] =>
  buildArgs(prompt, mode, NO_AGENTS, null, 3).args

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

  it('ADR-112: -p va SIN valor y el prompt viaja aparte, por stdin', () => {
    const l = buildArgs('revisa la seguridad', 'plan', NO_AGENTS, null, 3)
    expect(l.prompt).toBe('revisa la seguridad')
    expect(l.args[l.args.indexOf('-p') + 1]).toBe('--output-format')
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

  it('un tope de cero desactiva el limite, si el operador lo decide', () => {
    expect(buildArgs('hola', 'plan', NO_AGENTS, null, 0).args).not.toContain('--max-budget-usd')
  })

  it('nunca salta las comprobaciones de permisos', () => {
    expect(args('hola', 'acceptEdits').join(' ')).not.toContain('dangerously-skip-permissions')
  })

  it('solo viaja el MCP que arma FORTRESS', () => expect(args()).toContain('--strict-mcp-config'))
})

describe('buildArgs · allowlist de autoverificacion (gate de confianza)', () => {
  it('al editar en confianza, el allowlist se arma de los scripts REALES del repo', () => {
    const e = buildArgs('hola', 'acceptEdits', NO_AGENTS, null, 3, null, true, ['type-check']).args
    expect(e).toContain('Bash(npm run type-check)')
    expect(e).not.toContain('Bash(npm run typecheck)')
  })

  it('en plan NUNCA pasa la autoverificacion, aunque el repo sea de confianza', () => {
    // Auditar es mirar: el escaneo va en plan y no auto-ejecuta scripts del repo.
    const p = buildArgs('hola', 'plan', NO_AGENTS, null, 3, null, true).args
    expect(p).not.toContain('Bash(npm run test:unit)')
  })

  it('en un repo NO confiable no pasa la autoverificacion ni editando', () => {
    const e = buildArgs('hola', 'acceptEdits', NO_AGENTS, null, 3, null, false).args
    expect(e).not.toContain('Bash(npm run test:unit)')
  })
})
