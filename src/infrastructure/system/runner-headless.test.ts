import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import * as drenajeMod from '@application/repair/drenar-hasta-omega'
import * as deps from '../repair/drenaje-deps'
import * as self from './self-project'
import { correrHeadless } from './runner-headless'

afterEach(() => vi.restoreAllMocks())

const RUTA = '/repo/fortress'
// prettier-ignore
const DRENAJE = { fin: 'sin-candidato', trabajadas: 2, acumuladas: 2, vetadas: 0, porPresupuesto: 0, porTimeout: 0, porCorrea: 0, porLimitePropio: 0, porEntornoDelProyecto: 0, porDefectoInterno: 0, superadas: 0, sinClasificar: 0, colisiones: [] } as const

const ctx = (proyectos: { id: string; path: string }[]): AppContext =>
  ({ projects: { list: () => proyectos } }) as unknown as AppContext

function montar(hayFuente: boolean): ReturnType<typeof vi.spyOn> {
  vi.spyOn(self, 'selfProject').mockReturnValue(hayFuente ? ({ path: RUTA } as never) : null)
  vi.spyOn(self, 'isFortressRepo').mockImplementation((p) => p === RUTA)
  vi.spyOn(deps, 'construirDepsDelDrenaje').mockReturnValue({} as never)
  return vi.spyOn(drenajeMod, 'drenarHastaOmega').mockResolvedValue(DRENAJE as never)
}

describe('el runner headless respeta el SOBRE (drena, no aterriza)', () => {
  it('sin fuente FORTRESS-self (empaquetado/.asar) REHUSA y no drena', async () => {
    const espia = montar(false)
    const r = await correrHeadless(ctx([{ id: 'p1', path: RUTA }]))
    expect(r.rehusado).toBe(true)
    expect(espia).not.toHaveBeenCalled()
  })

  it('cliente-vedado: si FORTRESS-self no esta registrado, REHUSA (nunca drena un cliente)', async () => {
    const espia = montar(true)
    const r = await correrHeadless(ctx([{ id: 'otro', path: '/repo/cliente' }]))
    expect(r.rehusado).toBe(true)
    expect(espia).not.toHaveBeenCalled()
  })

  it('registrada: drena FORTRESS-self con las deps del HELPER compartido, UNA vez', async () => {
    const espia = montar(true)
    const r = await correrHeadless(ctx([{ id: 'fort', path: RUTA }]))
    expect(deps.construirDepsDelDrenaje).toHaveBeenCalledWith(expect.anything(), 'fort')
    expect(espia).toHaveBeenCalledTimes(1)
    expect(espia.mock.calls[0]?.[1]).toBe('fort')
    expect(r).toEqual({ rehusado: false, drenaje: DRENAJE })
  })
})

describe('nunca-vuelve estatico: el runner no pushea, no firma, no integra', () => {
  it('no importa git-push / firmar-integracion ni usa el modo completo', () => {
    const src = readFileSync('src/infrastructure/system/runner-headless.ts', 'utf8')
    expect(src).not.toMatch(/git-push|gitPush|firmarIntegracion|firmar-integracion/i)
    expect(src).not.toMatch(/'completo'|runMotorChain/)
  })
})
