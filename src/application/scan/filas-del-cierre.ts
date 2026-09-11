import type { Project } from '@domain/project/project'
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

  context.transaction(() => {
    const cerrada = context.scans.cerrar(datos.scanId, {
      estado: datos.motivo === 'completo' ? 'CERRADO' : 'ABORTADO',
      score,
      findingCount: datos.reportados.length,
      dossierCount: calculado.expediente.length,
      criticalCount: counts.CRITICAL,
      durationMs: datos.durationMs,
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

    context.projects.updateScan(project.id, score, datos.at)
    // `failed` sale del MOTIVO y ya no va escrito a mano: un recorrido que el
    // operador paro, o que reventó, no es una corrida que salio bien. Contarlo
    // como exito era la otra mitad de la mentira que dejaba el dia en 0 fallos.
    context.runs.record({ projectId: project.id, agentId: SCANNER_AGENT, kind: 'scan', durationMs: datos.durationMs, failed: datos.motivo !== 'completo', usage: datos.usage, tools: datos.tools }) // prettier-ignore
    context.activity.recordMany(scanActivity(project.id, SCANNER_AGENT, datos.reportados, counts, datos.edits)) // prettier-ignore
  })
}
