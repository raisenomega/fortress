import type { GrafoOverview } from '@domain/build/marco-de-grafo'
import type { ImpactoDeHallazgo } from '@domain/build/marco-de-impacto'
import { graphSlug } from '@domain/graph/graph-slug'
import type { Finding } from '@domain/project/finding'
import type { Project } from '@domain/project/project'
import { impactoSobreFence } from './leer-impacto-del-grafo'
import { overviewSobreFence } from './leer-overview-del-grafo'
import { prepararGrafoDelTurno } from './grafo-del-turno'

export interface GrafoDelTurnoLeido {
  readonly overview: GrafoOverview | null
  readonly impactos: readonly ImpactoDeHallazgo[]
}

/**
 * UN SOLO fence por turno (ADR-095): el overview (B.2) y el radio de impacto
 * (B.4) comparten la MISMA copia .db del proyecto anclado. `prepararGrafoDelTurno`
 * se llama UNA vez; NO se abre un 2o .db. Las dos lecturas corren en paralelo
 * sobre `turno.dir` y el fence se libera al terminar, pase lo que pase. Sin
 * grafo (hasGraph=0): overview null e impactos vacios, sin tocar disco.
 */
export async function leerGrafoDelTurno(
  project: Project,
  top: readonly Finding[]
): Promise<GrafoDelTurnoLeido> {
  if (!project.hasGraph) return { overview: null, impactos: [] }
  const turno = await prepararGrafoDelTurno(project.path)
  try {
    const slug = graphSlug(project.path)
    const [overview, impactos] = await Promise.all([
      overviewSobreFence(turno.dir, slug, project.id),
      impactoSobreFence(turno.dir, slug, project.id, top)
    ])
    return { overview, impactos }
  } finally {
    turno.liberar()
  }
}
