import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '../context'
import { recordMotorRun } from './record-motor-run'

/** El embudo por el que pasan TODAS las corridas del Motor: registra el modelo
 *  real, falla la corrida si el juicio fue «falla», y AVISA si fue «aviso». */
function ctx(): { c: AppContext; record: ReturnType<typeof vi.fn>; append: ReturnType<typeof vi.fn> } {
  const record = vi.fn((r: object) => ({ ...r, id: 'run-1' }))
  const append = vi.fn()
  return { c: { runs: { record }, omegaLog: { append } } as unknown as AppContext, record, append }
}
const base = { durationMs: 1, startedAt: 0, endedAt: 1 }

describe('el embudo de corridas lleva el modelo real', () => {
  it('juicio ok → registra el modelo, sin fallo ni aviso', () => {
    const { c, record, append } = ctx()
    recordMotorRun(c, 'p', null, { ...base, model: 'claude-opus-5-5', juicioModelo: { veredicto: 'ok', modelo: 'claude-opus-5-5' } }) // prettier-ignore
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ modelo: 'claude-opus-5-5', failed: false }))
    expect(append).not.toHaveBeenCalled()
  })

  it('juicio FALLA → la corrida se asienta fallida, aunque quien la llama no lo supiera', () => {
    const { c, record } = ctx()
    recordMotorRun(c, 'p', null, { ...base, model: 'claude-fable-5', juicioModelo: { veredicto: 'falla', modelo: 'claude-fable-5', motivo: 'Fable prohibido' } }) // prettier-ignore
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ modelo: 'claude-fable-5', failed: true }))
  })

  it('juicio AVISO → se registra, se sigue, y queda una nota visible en el registro de OMEGA', () => {
    const { c, record, append } = ctx()
    recordMotorRun(c, 'p', 'sentinel-omega', { ...base, model: 'claude-opus-5-5', juicioModelo: { veredicto: 'aviso', modelo: 'claude-opus-5-5', motivo: 'claude-opus-4-8 mas viejo' } }) // prettier-ignore
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ failed: false }))
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ verdict: 'discrepancia', summary: expect.stringMatching(/claude-opus-4-8/) })) // prettier-ignore
  })
})
