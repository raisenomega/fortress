import { describe, expect, it } from 'vitest'
import { cierre, corrida } from './collect-gate-fixture'
import { collectGateOutcome } from './collect-gate-outcome'

describe('collectGateOutcome: lo que el libro conserva del juicio', () => {
  it('reune los comandos y el veredicto del cierre', () => {
    const outcome = collectGateOutcome([corrida('npm ci'), corrida('lint'), cierre('GATE', {})])
    expect(outcome).toMatchObject({ ok: true })
    expect(outcome?.commands.map((c) => c.command)).toEqual(['npm ci', 'lint'])
  })

  it('recupera lo que NO se verifico cuando el asiento lo cuenta', () => {
    const eventos = [corrida('npm ci'), corrida('lint'), cierre('GATE', { skipped: ['typecheck'] })]
    expect(collectGateOutcome(eventos)?.skipped).toEqual(['typecheck'])
  })

  it('un asiento que no lo cuenta no se convierte en "no hubo saltos"', () => {
    const outcome = collectGateOutcome([corrida('npm ci'), corrida('lint'), cierre('GATE', {})])
    expect(outcome?.skipped).toBeUndefined()
  })

  it('tambien lo recupera de un cierre en rojo', () => {
    const eventos = [
      corrida('npm ci'),
      corrida('lint', 1),
      cierre('RECHAZADO', { skipped: ['typecheck', 'test:unit'] })
    ]
    const outcome = collectGateOutcome(eventos)
    expect(outcome).toMatchObject({ ok: false, failedAt: 'lint' })
    expect(outcome?.skipped).toEqual(['typecheck', 'test:unit'])
  })

  it('una lista que no es de textos se ignora en vez de colarse', () => {
    const eventos = [corrida('npm ci'), cierre('GATE', { skipped: [1, 2] })]
    expect(collectGateOutcome(eventos)?.skipped).toBeUndefined()
  })

  it('sin cierre no hay juicio que reunir', () => {
    expect(collectGateOutcome([corrida('npm ci')])).toBeNull()
  })
})

describe('collectGateOutcome: la herencia viaja en las dos ramas', () => {
  it('un rojo conserva TODOS los heredados, no solo el primero', () => {
    const eventos = [corrida('npm ci'), corrida('lint', 1), cierre('RECHAZADO', { heredado: ['lint', 'test:unit'] })] // prettier-ignore
    expect(collectGateOutcome(eventos)?.heredado).toEqual(['lint', 'test:unit'])
  })

  it('un cierre verde que cuente herencia tambien la conserva', () => {
    // Hoy ningun verde la trae; el dia que la traiga, reconstruirlo sin ella
    // convertiria un verde con deuda ajena en un verde entero.
    const eventos = [corrida('npm ci'), corrida('lint'), cierre('GATE', { heredado: ['lint'] })]
    const outcome = collectGateOutcome(eventos)
    expect(outcome).toMatchObject({ ok: true })
    expect(outcome?.heredado).toEqual(['lint'])
  })
})
