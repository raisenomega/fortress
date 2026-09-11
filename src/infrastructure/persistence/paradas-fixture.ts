import { cerrarEscaneo } from '@application/scan/cerrar-escaneo'
import { SIN_CAMPANA } from '@domain/scan/modulos-del-cierre'
import { asentarHallazgos } from '@application/scan/asentar-hallazgos'
import type { AppContext } from '@application/context'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import { crearBench, PROJECT, PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'

export const AT = '2026-09-09T22:00:00.000Z'

/** Tres paradas por carpeta, como las dividiria el recorrido de ADR-082. */
export const PARADAS: readonly (readonly DetectedFinding[])[] = [
  [{ severity: 'HIGH', title: 'Endpoint sin sesion', file: 'api/users.ts', line: 10 }],
  [
    { severity: 'MEDIUM', title: 'CORS admite localhost', file: 'api/cors.ts', line: 4 },
    { severity: 'LOW', title: 'Sin cabeceras', file: 'web/config.js', line: 2 }
  ],
  [{ severity: 'CRITICAL', title: 'Precio del body', file: 'api/checkout.ts', line: 42 }]
]

export interface Recorrido {
  readonly bench: Bench
  readonly scanId: string
  guardar(parada: readonly DetectedFinding[]): Promise<void>
  guardarLasTres(): Promise<void>
  /** Cierra con lo que reportaron las tres paradas. El motivo lo elige quien prueba. */
  cerrar(motivo: MotivoCierre, paradasHechas?: number, ficherosCubiertos?: number | null): void
  filas(): number
}

/** Un escaneo ABIERTO de doce paradas declaradas, listo para recibirlas. */
export function abrirRecorrido(paradasTotal = 3): Recorrido {
  const bench = crearBench()
  const { id } = bench.context.scans.abrir({
    projectId: PROYECTO,
    startedAt: AT,
    paradasTotal,
    ficherosTotal: 2108
  })

  const guardar = (parada: readonly DetectedFinding[]): Promise<void> =>
    asentarHallazgos(bench.context as AppContext, PROJECT, id, parada, AT)

  return {
    bench,
    scanId: id,
    guardar,
    guardarLasTres: async () => {
      for (const parada of PARADAS) await guardar(parada)
    },
    cerrar: (motivo, paradasHechas = 3, ficherosCubiertos = 2108) =>
      void cerrarEscaneo(bench.context, PROJECT, {
        scanId: id,
        reportados: PARADAS.flat(),
        paradasHechas,
        paradasTotal,
        ficherosCubiertos,
        ficherosTotal: 2108,
        modulos: SIN_CAMPANA,
        motivo,
        at: AT,
        durationMs: 5400,
        transcurridoMs: 900_000,
        usage: SIN_FACTURA,
        tools: [],
        edits: []
      }),
    filas: () => bench.cuantas('findings')
  }
}
