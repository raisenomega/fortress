import { describe, expect, it } from 'vitest'
import { buildArgs, buildEnv } from './claude-cli'

/**
 * Estos argumentos se verificaron contra `claude --help` de la version 2.1.220.
 * La spec original pedia `--headless --project <ruta>`: ninguno de los dos
 * existe, y usarlos hacia fallar cada ejecucion.
 */
describe('buildArgs', () => {
  it('usa -p, que es el flag no interactivo real', () => {
    expect(buildArgs('hola', 'plan')).toContain('-p')
  })

  it('no usa --headless: no existe en el CLI', () => {
    expect(buildArgs('hola', 'plan')).not.toContain('--headless')
  })

  it('no usa --project: el proyecto se fija con el cwd', () => {
    expect(buildArgs('hola', 'plan').join(' ')).not.toContain('--project')
  })

  it('pasa el prompt justo despues de -p', () => {
    const args = buildArgs('revisa la seguridad', 'plan')
    expect(args[args.indexOf('-p') + 1]).toBe('revisa la seguridad')
  })

  it('pide stream-json con verbose, que es lo que emite los eventos', () => {
    const args = buildArgs('hola', 'plan')
    expect(args[args.indexOf('--output-format') + 1]).toBe('stream-json')
    expect(args).toContain('--verbose')
  })

  it('traslada el modo de permisos al CLI', () => {
    const plan = buildArgs('hola', 'plan')
    const edits = buildArgs('hola', 'acceptEdits')
    expect(plan[plan.indexOf('--permission-mode') + 1]).toBe('plan')
    expect(edits[edits.indexOf('--permission-mode') + 1]).toBe('acceptEdits')
  })

  it('nunca salta las comprobaciones de permisos', () => {
    const args = buildArgs('hola', 'acceptEdits').join(' ')
    expect(args).not.toContain('dangerously-skip-permissions')
  })
})

describe('buildEnv', () => {
  it('pasa la key configurada en FORTRESS', () => {
    expect(buildEnv('sk-ant-xyz').ANTHROPIC_API_KEY).toBe('sk-ant-xyz')
  })

  it('sin key, deja que claude use sus propias credenciales', () => {
    expect(buildEnv(null)).toBe(process.env)
  })
})
