import type { Project } from '@domain/project/project'
import { yaHayFactura } from '@domain/scan/factura-del-cierre'
import { notaDelCierre } from '@domain/scan/nota-del-cierre'
import { SCORE_PROVISIONAL } from '@domain/scan/scan-history-repository'
import type { AppContext } from '../context'
import { scanActivity } from '../telemetry/scan-activity'
import type { Calculado, DatosDelCierre } from './datos-del-cierre'

/** El escaneo lo hace el Security Reviewer: es la FASE 1 del protocolo. */
const SCANNER_AGENT = 'security-reviewer' as const

/**
 * Las filas del CIERRE, en una transaccion. Siguen juntas por lo mismo que
 * estaban juntas antes: describen el mismo hecho —este escaneo termino asi— y
 * si entrara solo una parte el tablero contaria una version distinta.
 *
 * Lo que YA NO esta aqui son los hallazgos: esos los guardo cada parada segun
 * los encontraba, que es el reparto que trae ADR-082. La fila del escaneo ya
 * existe desde que se abrio, asi que aqui se ACTUALIZA en vez de crearse.
 */
export function escribirFilasDelCierre(
  context: AppContext,
  project: Project,
  datos: DatosDelCierre,
  calculado: Calculado
): void {
  const { score, counts } = calculado
  const nota = notaDelCierre(score, datos.paradasHechas)

  context.transaction(() => {
    const cerrada = context.scans.cerrar(datos.scanId, {
      estado: datos.motivo === 'completo' ? 'CERRADO' : 'ABORTADO',
      score: nota ?? SCORE_PROVISIONAL,
      findingCount: context.findings.countByScan(datos.scanId),
      dossierCount: calculado.expediente.length,
      criticalCount: counts.CRITICAL,
      // El reloj de PARED, no la suma de paradas: un escaneo que murio en su
      // primera parada tiene cero auditado y quince minutos de vida, y la fila
      // tiene que decir cuanto duro el escaneo, no cuanto se alcanzo a auditar
      // —eso ya lo dicen `paradas_hechas` y `ficheros_cubiertos`—.
      durationMs: datos.transcurridoMs,
      paradasHechas: datos.paradasHechas,
      ficherosCubiertos: datos.ficherosCubiertos,
      motivoCierre: datos.motivo,
      // La campana entera, serializada: es lo que el informe transcribe.
      modulos: JSON.stringify(datos.modulos),
      at: datos.at
    })

    // Si la fila ya no esta —el proyecto se borro a mitad del escaneo y el
    // CASCADE se la llevo— no hay escaneo que cerrar, y las demas filas
    // hablarian de algo que no existe. Se para aqui, sin escribir nada.
    if (!cerrada) return

    // Solo si el escaneo vio algo (ver `notaDelCierre`): el tablero lee ESTA nota.
    if (nota !== null) context.projects.updateScan(project.id, nota, datos.at)
    // La corrida se asienta UNA vez. Si el intento ya la asento con su factura
    // real (`yaHayFactura`), esta seria una segunda con ceros — y una factura
    // de ceros afirma que la corrida salio gratis, que es justo lo que
    // `asentarIntentoFallido` advierte que no se puede decir.
    //
    // `failed` sale del MOTIVO y no va escrito a mano: un recorrido que el
    // operador paro, o que reventó, no es una corrida que salio bien. Contarlo
    // como exito era la otra mitad de la mentira que dejaba el dia en 0 fallos.
    if (!yaHayFactura(datos.motivo)) {
      context.runs.record({ projectId: project.id, agentId: SCANNER_AGENT, kind: 'scan', durationMs: datos.durationMs, failed: datos.motivo !== 'completo', usage: datos.usage, tools: datos.tools, ...(datos.modelo === undefined ? {} : { modelo: datos.modelo }) }) // prettier-ignore
    }
    context.activity.recordMany(scanActivity(project.id, SCANNER_AGENT, datos.reportados, counts, datos.edits)) // prettier-ignore
  })
}
