import { afterEach, describe, expect, it, vi } from 'vitest'
import { motivoDelGenerador } from './motivo-del-generador'
import { falloDeOmega } from './omega-autopsia'
import { CTX, deps, espera, motor } from './drenar-fixture'
import { drenarHastaOmega } from './drenar-hasta-omega'
import * as cadena from './run-motor-chain'

afterEach(() => vi.restoreAllMocks())

const RUN_META = { durationMs: 9, startedAt: 1, endedAt: 10 }

describe('los tres agentes nombran igual al CLI que no arranca', () => {
  it('el generador: cli_no_arranco, no una caida del proveedor', () => {
    expect(motivoDelGenerador({ noArranco: true })).toBe('cli_no_arranco')
  })

  it('gana a los turnos y al reloj: sin proceso no hubo ni vueltas ni plazo', () => {
    // prettier-ignore
    expect(motivoDelGenerador({ noArranco: true, turnosAgotados: true, timedOut: true })).toBe('cli_no_arranco')
  })

  it('OMEGA: cli_no_arranco, no omega_error', () => {
    const fallo = { ok: false as const, error: 'spawn claude ENOENT', timedOut: false, noArranco: true as const, runMeta: RUN_META } // prettier-ignore
    expect(falloDeOmega(fallo).reason).toBe('cli_no_arranco')
  })

  it('OMEGA sin la bandera sigue como estaba: no-regresion', () => {
    const fallo = { ok: false as const, error: 'lo que sea', timedOut: false, runMeta: RUN_META }
    expect(falloDeOmega(fallo).reason).toBe('omega_error')
    expect(falloDeOmega({ ...fallo, timedOut: true }).reason).toBe('omega_timeout')
  })
})

describe('el drenaje corta, y el parte dice que fue la maquina', () => {
  it('un CLI que no arranca acaba el drenaje con su propio fin', async () => {
    vi.spyOn(cadena, 'runMotorChain').mockResolvedValue({ ok: false, error: 'cli_no_arranco: spawn ENOENT' }) // prettier-ignore

    const r = await drenarHastaOmega(CTX, 'p1', deps())

    expect(r.fin).toBe('entorno')
    expect(r.detalle).toContain('ENOENT')
  })

  it('una caida del proveedor sigue siendo averia: son cosas distintas', async () => {
    vi.spyOn(cadena, 'runMotorChain').mockResolvedValue({ ok: false, error: 'overloaded' })
    expect((await drenarHastaOmega(CTX, 'p1', deps())).fin).toBe('averia')
  })

  it('corta de verdad: no sigue con la siguiente propuesta', async () => {
    // Es la diferencia con el reloj, que no corta. Aqui seguir compraria el
    // mismo fallo una vez por hallazgo, porque falta un binario en la maquina.
    let vueltas = 0
    vi.spyOn(cadena, 'runMotorChain').mockImplementation(() => {
      vueltas += 1
      return Promise.resolve({ ok: false, error: 'cli_no_arranco: spawn EACCES' })
    })

    await drenarHastaOmega(CTX, 'p1', deps({ maxVueltas: 6 }))

    expect(vueltas).toBe(1)
  })

  it('no-regresion: sin fallos el pozo se sigue vaciando', async () => {
    motor(espera('a'), espera('b'))
    expect((await drenarHastaOmega(CTX, 'p1', deps())).fin).toBe('sin-candidato')
  })
})
