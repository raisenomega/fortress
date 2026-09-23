import type { Project } from '@domain/project/project'
import type { AnalystResult } from '@domain/repair/analysis'
import type { Selection } from '@domain/repair/select-target'
import type { AppContext } from '../context'
import { hermanosCitados, hermanosDelHallazgo } from '@domain/repair/hermanos-del-hallazgo'
import { intentosPrevios } from '@domain/repair/intentos-previos'
import { tipoDeLaIdentidad } from '@domain/project/finding-identity'
import { loYaAtendido } from '../system/lo-ya-atendido'
import { analyzeTarget } from './analyze-target'

/**
 * El analista MAS lo que FORTRESS ya trato. Existe para que la memoria no sea
 * opcional: hay dos caminos al analisis —el normal y el reintento— y el mismo
 * hecho no puede tener dos destinos segun por donde se entre (ADR-059). Con la
 * lectura suelta en cada llamador, el tercero que aparezca la olvidara, y el
 * sintoma seria mudo: el analista simplemente volveria a observar lo resuelto,
 * que es exactamente lo que hacia antes de existir este bucle.
 *
 * La base se lee AQUI, en la aplicacion, y baja ya formateada. El analista vive
 * en infraestructura y no alcanza el repositorio: no es un descuido de cableado,
 * es la capa haciendo su trabajo.
 */
export function estudiar(
  ctx: AppContext,
  project: Project,
  selection: Selection
): Promise<AnalystResult> {
  // El expediente del hallazgo se lee AQUI por lo mismo que la memoria: hay dos
  // caminos al analisis y el dato no puede depender de por cual se entre.
  const suyas = ctx.repairProposals
    .listByProject(project.id)
    .filter((p) => p.findingId === selection.target.id)
  // Las otras sedes abiertas del mismo defecto se leen del mismo sitio y por la
  // misma razon: el analista no alcanza la base, y el dato no puede depender de
  // por que camino se entre al analisis.
  const abiertos = ctx.findings
    .listMemory(project.id)
    .filter((f) => f.status === 'open' && f.lifecycle === 'ACTIVE')
    .map((f) => ({ id: f.id, file: f.file, line: f.line, title: f.title, tipo: tipoDeLaIdentidad(f.identity), simbolo: f.simbolo, firstSeen: f.firstSeen })) // prettier-ignore
  const target = {
    ...selection.target,
    intentos: intentosPrevios(suyas),
    hermanos: hermanosDelHallazgo(selection.target, abiertos),
    hermanosCitados: hermanosCitados(selection.target, abiertos)
  }
  return analyzeTarget(ctx.analystFor(project.path, project.id), { ...selection, target }, loYaAtendido(ctx)) // prettier-ignore
}
