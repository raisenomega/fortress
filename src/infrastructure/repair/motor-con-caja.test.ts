import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDelTurno } from '../claude-code/args-del-turno'
import { olvidarSonda } from '../sandbox/sonda-de-bwrap'
import { argsDeLectura, argsDelGenerador } from './generator-args'
import { createGraphOmega } from './graph-omega'

/** Un worktree bajo el HOME, como los del motor (no /tmp: es un tmpfs en la caja). */
const worktree = (): string => carpetaDePrueba('.fortress-motor-test-')
const abre = <T>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error)
  return r.value
}
afterEach(olvidarSonda)
afterAll(limpiarCarpetasDePrueba)

describe('el motor y el Terminal lanzan el CLI con la caja puesta (ADR-092, clase A)', () => {
  it('los que solo leen: analista, critico y OMEGA llevan --settings con el sandbox', () => {
    const args = abre(argsDeLectura('juzga', worktree(), '/grafo/turno')).args
    expect(args[0]).toBe('-p')
    const i = args.indexOf('--settings')
    expect(i).toBeGreaterThan(0)
    expect(JSON.parse(args[i + 1] ?? '')).toMatchObject({
      sandbox: { enabled: true, failIfUnavailable: true }
    })
  })

  it('el generador tambien, y ademas conserva su techo de turnos', () => {
    const args = abre(argsDelGenerador('arregla', worktree(), '/grafo/turno')).args
    expect(args).toContain('--settings')
    expect(args).toContain('--max-turns')
  })

  it('el turno del Terminal: --settings al final, tras lo que buildArgs armo', () => {
    const request = { projectPath: worktree(), prompt: 'hola', permissionMode: 'auditoria', agentId: null, trusted: true } as const // prettier-ignore
    const args = abre(argsDelTurno(request, {}, null, 0, '/grafo/turno')).args
    expect(args[0]).toBe('-p')
    expect(args.at(-2)).toBe('--settings')
  })

  it('FAIL-CLOSED en OMEGA: sin caja no arranca, y lo dice como un binario que no existe', async () => {
    const path = process.env.PATH
    process.env.PATH = '/nonexistent'
    olvidarSonda()
    try {
      const result = await createGraphOmega('/bin/true', 'p1').run(worktree(), 'p')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toBe('sin-caja:falta-bwrap')
    } finally {
      process.env.PATH = path
    }
  })
})
