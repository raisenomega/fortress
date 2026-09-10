import type { Project } from '@domain/project/project'
import type { Parada } from '@domain/scan/manifiesto'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import type { Scanner } from '@domain/scan/scanner'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'

/**
 * Una parada, escaneada entera. Las `rutas` acotan la pasada en el prompt; el
 * `projectPath` sigue siendo la RAIZ, que es de donde cuelgan el grafo, el
 * corpus y la identidad de los hallazgos (ADR-082, Enmienda 1).
 *
 * Los `modulos` son los mismos en todas las paradas —los que el manifiesto
 * declaro aplicables— y viajan parada a parada porque el resumen se compone
 * CON la carpeta: el mismo modulo dice cosas distintas en `src/ui` y en
 * `src/api` (ADR-083, Fase 2).
 */
export function escanearParada(
  scanner: Scanner,
  project: Project,
  parada: Parada,
  progreso: ProgresoDelRecorrido,
  modulos: readonly ModuloAuditoria[] = []
): ReturnType<Scanner['scan']> {
  return scanner.scan(
    {
      projectPath: project.path,
      projectName: project.name,
      projectId: project.id,
      rutas: [parada.carpeta],
      modulos
    },
    progreso.texto
  )
}
