import { afterEach, describe, expect, it, vi } from 'vitest'
import * as cierre from './cerrar-ciclo-terminal'
import { turno } from './turno-con-foco-fixture'

afterEach(() => vi.restoreAllMocks())

const NEUTRO = 'Resuelve este hallazgo'

describe('sendMessage cierra el ciclo DESPUES de guardar la respuesta (ADR-088, pieza 3)', () => {
  it('con foco: el hallazgo, el turno conservado y la respuesta YA guardada', async () => {
    const espia = vi.spyOn(cierre, 'cerrarYContar').mockResolvedValue(null)
    const { r } = await turno({ prompt: NEUTRO, findingId: 'f-neutro' })

    expect(r.ok).toBe(true)
    if (!r.ok) return
    const [, findingId, protegido, respuesta] = espia.mock.calls[0]
    expect(findingId).toBe('f-neutro')
    expect(protegido.conservado).toBe(true)
    // La que la nota cita es la misma que el turno devuelve: ya existe en la base.
    expect(respuesta).toEqual(r.value.assistant)
  })

  it('sin foco: le llega null, que es la primera guarda del cierre', async () => {
    const espia = vi.spyOn(cierre, 'cerrarYContar').mockResolvedValue(null)
    await turno({ prompt: NEUTRO })

    expect(espia.mock.calls[0][1]).toBeNull()
  })

  it('un turno degradado a plan no tiene red: llega NO conservado', async () => {
    // `src/auth/…` degrada a plan; sin red nada garantiza lo que quedo en el arbol.
    const espia = vi.spyOn(cierre, 'cerrarYContar').mockResolvedValue(null)
    await turno({ prompt: NEUTRO, findingId: 'f-auth' })

    expect(espia.mock.calls[0][2].conservado).toBe(false)
  })

  it('de punta a punta: con foco pero SIN ediciones, no se escribe ningun cierre', async () => {
    // El CLI de mentira no edita nada: turno verde y con foco, pero nada arreglado.
    const { added } = await turno({ prompt: NEUTRO, findingId: 'f-neutro' })

    expect(added.map((m) => m.role)).toEqual(['user', 'assistant'])
  })
})
