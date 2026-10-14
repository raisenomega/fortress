import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChainOutcome } from './motor-chain-outcome'
import { CTX, deps, espera, motor } from './drenar-fixture'
import { drenarHastaOmega } from './drenar-hasta-omega'

afterEach(() => vi.restoreAllMocks())

const baja = (motivo: string): ChainOutcome => ({ kind: 'descartada', proposalId: 'x', motivo })

describe('el drenaje cuenta lo que hizo, no solo lo que dejo', () => {
  it('una corrida con 2 firmas, 1 veto y 1 presupuesto se cuenta entera', async () => {
    motor(espera('a'), baja('omega_vetado: el cerrojo ya existe'), espera('b'), baja('budget_exceeded')) // prettier-ignore

    // toEqual y no toMatchObject: fija la forma ENTERA, asi que una casilla
    // nueva sin poner a cero aqui se nota en vez de colarse.
    expect(await drenarHastaOmega(CTX, 'p1', deps())).toEqual({
      fin: 'sin-candidato', trabajadas: 4, acumuladas: 2, vetadas: 1, porPresupuesto: 1,
      porTimeout: 0, porCorrea: 0, porLimitePropio: 0, porEntornoDelProyecto: 0,
      porDefectoInterno: 0, superadas: 0, sinClasificar: 0, colisiones: []
    }) // prettier-ignore
  })

  it('el motivo llega con sufijo y se clasifica igual, por prefijo', async () => {
    motor(baja('omega_vetado: razon larga del revisor'))
    expect((await drenarHastaOmega(CTX, 'p1', deps())).vetadas).toBe(1)
  })

  it('gate rojo y correa rota no son ni veto ni dinero', async () => {
    motor(baja('gate_failed_at=lint'), baja('scope_violation'))
    const r = await drenarHastaOmega(CTX, 'p1', deps())
    expect(r).toMatchObject({ trabajadas: 2, porCorrea: 2, vetadas: 0, porPresupuesto: 0 })
  })

  it('los relojes de los TRES jueces van a su casilla, no con las del gate', async () => {
    // Contarlos como "gate o correa" mandaba al operador a leer un diff que
    // nunca llego a juzgarse: la propuesta murio antes, y por tiempo.
    motor(baja('generator_timeout'), baja('gate_timeout'), baja('omega_timeout'))
    const r = await drenarHastaOmega(CTX, 'p1', deps())
    expect(r).toMatchObject({ trabajadas: 3, porTimeout: 3, porCorrea: 0 })
  })

  it('un reloj agotado NO corta el drenaje: el pozo se sigue vaciando', async () => {
    motor(baja('generator_timeout'), espera('b'), baja('omega_timeout'), espera('c'))
    const r = await drenarHastaOmega(CTX, 'p1', deps())
    expect(r.fin).toBe('sin-candidato')
    expect(r).toMatchObject({ trabajadas: 4, acumuladas: 2, porTimeout: 2 })
  })

  it('una vuelta sin candidato no cuenta como trabajada', async () => {
    motor()
    expect((await drenarHastaOmega(CTX, 'p1', deps())).trabajadas).toBe(0)
  })
})
