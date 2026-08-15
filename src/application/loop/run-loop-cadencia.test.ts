import { describe, expect, it, vi } from 'vitest'
import { runLoop } from './run-loop'
import { CERRADA, config, deps, esperaFirma, SIN_CANDIDATO } from './run-loop-fixture'

/** Tope de propuestas alto: lo que se mide aqui es cuando se vuelve a escanear. */
const holgado = { ...config, maxCycles: 50 }

describe('runLoop: cada cuanto se vuelve a medir', () => {
  it('con cadencia 3, dos integraciones no disparan escaneo y la tercera si', async () => {
    // Entre dos merges el arbol es identico: escanearlo otra vez seria pagar
    // por leer lo mismo. Se acumula hasta que hay algo que medir.
    const scan = vi.fn().mockResolvedValue(50)
    const fix = vi.fn().mockResolvedValue(CERRADA)
    await runLoop({ ...holgado, maxCycles: 3 }, deps({ scan, fix, rescanEvery: () => 3 }))

    // Uno es el escaneo base del arranque; el otro, el de la tercera integracion.
    expect(scan).toHaveBeenCalledTimes(2)
    expect(fix).toHaveBeenCalledTimes(3)
  })

  it('la cuenta arranca de nuevo tras cada escaneo, no tras cada integracion', async () => {
    const scan = vi.fn().mockResolvedValue(50)
    await runLoop({ ...holgado, maxCycles: 6 }, deps({ scan, rescanEvery: () => 3 }))

    // Seis integraciones con cadencia 3: base + dos escaneos, no base + seis.
    expect(scan).toHaveBeenCalledTimes(3)
  })

  it('lo que no integra no adelanta la cadencia', async () => {
    // Aprobada y esperando firma, descartada, obsoleta o sin candidato: ninguna
    // toca el arbol, asi que ninguna acerca el momento de volver a medirlo.
    const scan = vi.fn().mockResolvedValue(50)
    const fix = vi
      .fn()
      .mockResolvedValueOnce(esperaFirma('disabled'))
      .mockResolvedValueOnce(SIN_CANDIDATO)
      .mockResolvedValue({ kind: 'descartada', proposalId: 'p', motivo: 'gate_failed' })
    await runLoop({ ...holgado, maxCycles: 2 }, deps({ scan, fix, rescanEvery: () => 1 }))

    expect(scan).toHaveBeenCalledTimes(1) // solo el escaneo base
  })

  it('cadencia cero mide en cada vuelta, integre o no', async () => {
    // Es el comportamiento de antes de que hubiera cadencia, disponible como
    // ajuste. Cero no apaga el escaneo: lo pide siempre.
    let gasto = 0
    const scan = vi.fn().mockImplementation(() => Promise.resolve((gasto += 12) && 50))
    const fix = vi.fn().mockResolvedValue(SIN_CANDIDATO)
    const reason = await runLoop(holgado, deps({ scan, fix, rescanEvery: () => 0, spentSession: () => gasto })) // prettier-ignore

    // Ninguna vuelta integro y aun asi se midio en todas: base + dos vueltas.
    expect(scan).toHaveBeenCalledTimes(3)
    expect(reason).toBe('tope-gasto')
  })
})
