import type { Project } from '@domain/project/project'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import { esDeTema, type Parada } from '@domain/scan/parada'
import type { ScanRequest, Scanner } from '@domain/scan/scanner'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'

/**
 * A que mira esta pasada, segun la clase de parada.
 *
 * Una de CARPETA acota `rutas` y lleva los modulos de carpeta que el manifiesto
 * declaro aplicables: los mismos en todas, y viajan parada a parada porque el
 * resumen se compone CON la carpeta —el mismo modulo dice cosas distintas en
 * `src/ui` y en `src/api` (ADR-083, Fase 2)—.
 *
 * Una de TEMA lleva el suyo y NINGUNA ruta. Que `rutas` falte ya significa «el
 * proyecto entero» desde que existen las paradas, asi que su pasada usa el
 * carril que el escaneo de una pieza lleva usando desde siempre: no hay camino
 * nuevo que probar, solo uno que se estrena con otro foco.
 */
function alcanceDe(
  parada: Parada,
  deCarpeta: readonly ModuloAuditoria[]
): Pick<ScanRequest, 'rutas' | 'modulos'> {
  return esDeTema(parada)
    ? { modulos: [parada.modulo] }
    : { rutas: [parada.carpeta], modulos: deCarpeta }
}

/**
 * Una parada, escaneada entera. El `projectPath` sigue siendo la RAIZ sea cual
 * sea la clase, que es de donde cuelgan el grafo, el corpus y la identidad de
 * los hallazgos (ADR-082, Enmienda 1).
 */
export function escanearParada(
  scanner: Scanner,
  project: Project,
  parada: Parada,
  progreso: ProgresoDelRecorrido,
  deCarpeta: readonly ModuloAuditoria[] = []
): ReturnType<Scanner['scan']> {
  return scanner.scan(
    {
      projectPath: project.path,
      projectName: project.name,
      projectId: project.id,
      ...alcanceDe(parada, deCarpeta)
    },
    progreso.texto
  )
}
