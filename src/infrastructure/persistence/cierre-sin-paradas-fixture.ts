import { cerrarEscaneo } from '@application/scan/cerrar-escaneo'
import type { DatosDelCierre } from '@application/scan/datos-del-cierre'
import { SIN_CAMPANA } from '@domain/scan/modulos-del-cierre'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import { PROJECT, PROYECTO, SIN_FACTURA, type Bench } from './cierre-partido-fixture'

/** Quince minutos de reloj con cero paradas: lo que le paso a Health Flow. */
export const QUINCE_MIN = 901_727

/** Un cierre con CERO paradas terminadas: lo que le paso a Health Flow. */
export function cerrarSinParadas(bench: Bench, motivo: MotivoCierre): void {
  const scanId = bench.context.scans.abrir({
    projectId: PROYECTO,
    startedAt: '2026-09-11T01:37:52.201Z',
    paradasTotal: 12,
    ficherosTotal: 1730
  }).id
  const datos: DatosDelCierre = {
    scanId,
    reportados: [],
    paradasHechas: 0,
    paradasTotal: 12,
    ficherosCubiertos: 0,
    ficherosTotal: 1730,
    modulos: SIN_CAMPANA,
    motivo,
    at: '2026-09-11T01:52:54.035Z',
    // Lo AUDITADO es cero: ninguna parada termino. Lo transcurrido, quince min.
    durationMs: 0,
    transcurridoMs: QUINCE_MIN,
    usage: SIN_FACTURA,
    tools: [],
    edits: []
  }
  cerrarEscaneo(bench.context, PROJECT, datos)
}
