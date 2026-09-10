import { describe, expect, it } from 'vitest'
import { persistScan } from '@application/scan/persist-scan'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { caminoSoldado } from './camino-soldado'
import { corrida, crearBench, PROJECT, PROYECTO } from './cierre-partido-fixture'

const HALLAZGOS: readonly DetectedFinding[] = [
  { severity: 'CRITICAL', title: 'El checkout cobra el precio del body', file: 'api/checkout.ts', line: 42 }, // prettier-ignore
  {
    severity: 'HIGH',
    title: 'La API arranca sin tope de peticiones',
    file: 'api/main.ts',
    line: 5
  },
  { severity: 'LOW', title: 'Sin cabeceras de seguridad', file: 'web/next.config.js', line: 2 }
]

/** Los dos caminos sobre el mismo punto de partida y la misma corrida. */
async function ambos(): Promise<{
  soldado: ReturnType<typeof crearBench>
  partido: ReturnType<typeof crearBench>
}> {
  const soldado = crearBench()
  const partido = crearBench()
  await caminoSoldado(soldado.context, PROJECT, corrida(HALLAZGOS))
  await persistScan(partido.context, PROJECT, corrida(HALLAZGOS))
  return { soldado, partido }
}

describe('el camino partido produce lo MISMO que la transaccion soldada', () => {
  it('misma fila de escaneo: score, conteos y duracion', async () => {
    const { soldado, partido } = await ambos()

    expect(partido.filaDelEscaneo()).toEqual(soldado.filaDelEscaneo())
    // Y el numero real, no solo "igual al otro": un CRITICAL topa en 64, y
    // 100-25-8-1 = 66 queda por encima del techo.
    expect(partido.filaDelEscaneo().score).toBe(64)
  })

  it('mismos hallazgos guardados, con el mismo ciclo de vida', async () => {
    const { soldado, partido } = await ambos()

    expect(partido.hallazgosGuardados()).toEqual(soldado.hallazgosGuardados())
    expect(partido.hallazgosGuardados()).toHaveLength(3)
  })

  it('mismo rastro: una fila de escaneo, una corrida y el mismo timeline', async () => {
    const { soldado, partido } = await ambos()

    for (const tabla of ['scans', 'agent_runs', 'activity']) {
      expect(partido.cuantas(tabla)).toBe(soldado.cuantas(tabla))
    }
    expect(partido.cuantas('scans')).toBe(1)
    expect(partido.cuantas('agent_runs')).toBe(1)
  })

  it('el score del proyecto queda igual, y la memoria se escribe UNA vez', async () => {
    const { partido } = await ambos()

    expect(partido.context.projects.findById(PROYECTO)?.fortressScore).toBe(64)
    expect(partido.escrituras()).toBe(1)
  })
})
