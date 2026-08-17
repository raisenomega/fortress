import type { HealthCheck } from '@domain/health/health-check'
import type { Project } from '@domain/project/project'
import { readCorpusConfig } from '../project/corpus-config'

const ID = 'corpus'
const LABEL = 'Corpus declarado por el proyecto'
const FIX =
  'Corrige la clave `corpus` de ese .fortress/config o quitala. Mientras siga ilegible, ' +
  'el proyecto se documenta solo con lo que se encuentra por convencion.'

/** El proyecto y su razon, o null si no declara corpus o lo declara bien. */
function ilegible(project: Project): string | null {
  const config = readCorpusConfig(project.path)
  if (config.kind !== 'invalid') return null
  return `${project.name} (.fortress/config): ${config.reason}`
}

/**
 * Declarar el corpus es opcional: no declararlo no es defecto. Una declaracion
 * que no se puede leer SI lo es, y ademas es silenciosa — el proyecto sigue
 * funcionando con lo que se descubre por convencion, y quien la escribio se
 * queda creyendo que sus documentos se citan.
 *
 * Advertencia y no error a proposito: nada deja de funcionar, asi que teñir la
 * salud del sistema entero exagera el hecho. Alguien se esta equivocando sin
 * enterarse, que es distinto de algo roto.
 */
export function checkCorpusConfig(projects: readonly Project[]): HealthCheck {
  const rotos = projects.map(ilegible).filter((linea): linea is string => linea !== null)

  if (rotos.length === 0) {
    return { id: ID, label: LABEL, level: 'ok', detail: 'Ninguna declaracion ilegible', fix: null }
  }

  return {
    id: ID,
    label: LABEL,
    level: 'warning',
    detail: `Declaracion ilegible en: ${rotos.join(' · ')}`,
    fix: FIX
  }
}
