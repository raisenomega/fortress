import { describe, expect, it } from 'vitest'
import type { CommandOutcome, GateOutcome } from './gate-result'
import { rojoReanudable } from './rojo-reanudable'

/** ADR-115 B2: la FRONTERA. Solo el rojo propio de codigo, con lineas, vuelve al
 *  generador; todo lo demas es del entorno, o un defecto nuestro, y es terminal. */
const roto = (command: string, errores: string[] = ['/w/a.ts 1:1  error  x  regla']): CommandOutcome => ({ command, exitCode: 1, durationMs: 1, stdoutTail: '', stderrTail: '', timedOut: false, errores }) // prettier-ignore
const rojo = (failedAt: string, reason: Extract<GateOutcome, { ok: false }>['reason'], extra: Partial<Extract<GateOutcome, { ok: false }>> = {}): GateOutcome => ({ ok: false, failedAt, reason, commands: [roto(failedAt)], ...extra }) // prettier-ignore

describe('se reanuda: el rojo de CODIGO del fix, con lineas de error', () => {
  it.each(['typecheck', 'lint', 'test:unit'])('%s', (paso) => {
    expect(rojoReanudable(rojo(paso, 'gate_failed'))).toMatchObject({ failedAt: paso })
  })
})

describe('se queda TERMINAL', () => {
  it('un timeout: es del reloj, no del codigo', () => {
    expect(rojoReanudable(rojo('lint', 'gate_timeout'))).toBeNull()
  })
  it('npm ci roto: es del entorno', () => {
    expect(rojoReanudable(rojo('npm ci', 'npm_ci_failed'))).toBeNull()
  })
  it('un proyecto sin scripts que verificar', () => {
    expect(rojoReanudable(rojo('scripts', 'gate_sin_verificacion'))).toBeNull()
  })
  it('el invariante de los heredados (gate-sequence): no es un error del fix', () => {
    expect(rojoReanudable(rojo('lint', 'gate_failed', { heredado: ['lint'] }))).toBeNull()
    expect(rojoReanudable(rojo('desconocido', 'gate_failed'))).toBeNull()
  })
  it('un rojo sin lineas de error: no hay nada que darle al generador', () => {
    expect(rojoReanudable({ ok: false, failedAt: 'lint', reason: 'gate_failed', commands: [roto('lint', [])] })).toBeNull() // prettier-ignore
  })
})
