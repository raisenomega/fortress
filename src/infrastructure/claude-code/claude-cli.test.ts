import { describe, expect, it } from 'vitest'
import { buildArgs } from './claude-cli'

const NO_AGENTS = {}

/** Sin agentes ni despacho: la forma minima. */
const args = (prompt = 'hola', mode: 'plan' | 'acceptEdits' = 'plan'): string[] =>
  buildArgs(prompt, mode, NO_AGENTS, null, 3)

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

  it('un tope de cero desactiva el limite, si el operador lo decide', () => {
    expect(buildArgs('hola', 'plan', NO_AGENTS, null, 0)).not.toContain('--max-budget-usd')
  })

  it('nunca salta las comprobaciones de permisos', () => {
    expect(args('hola', 'acceptEdits').join(' ')).not.toContain('dangerously-skip-permissions')
  })
})

describe('buildArgs · allowlist de autoverificacion (gate de confianza)', () => {
  it('el allowlist solo aparece al editar en un repo de confianza', () => {
    const built = buildArgs('hola', 'acceptEdits', NO_AGENTS, null, 3, null, true)
    expect(built).toContain('--allowedTools')
    expect(built).toContain('Bash(npm run test:unit)')
  })

  it('en plan NUNCA pasa el allowlist, aunque el repo sea de confianza', () => {
    // El escaneo va en plan: auditar es mirar, no auto-ejecutar scripts del repo.
    expect(buildArgs('hola', 'plan', NO_AGENTS, null, 3, null, true)).not.toContain('--allowedTools')
  })

  it('en un repo NO confiable no pasa el allowlist ni editando', () => {
    // `npm run X` es codigo del repo auditado: sin confianza, no se auto-ejecuta.
    const built = buildArgs('hola', 'acceptEdits', NO_AGENTS, null, 3, null, false)
    expect(built).not.toContain('--allowedTools')
  })
})
