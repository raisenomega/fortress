import type { AppContext } from '../context'
import type { Resolucion } from './fichero-a-probar'

/**
 * De los controles presentes+atribuidos (`controlesEnHead`), los que estan EN LA
 * RUTA del hallazgo —conectados por imports al ancla—. La conectividad es
 * OBLIGATORIA, no decorativa: el mismo marcador puede aparecer en un fichero de
 * otra capa (p. ej. `install-graph` lleva el mismo `if (!ejecutaConConfianza)`
 * que `gate-guards`) y ese NO cuenta porque no esta en el grafo del ancla.
 *
 *   UNO en ruta → ese fichero (verificarMitigado lo prueba y cierra).
 *   NINGUNO       → conserva: el control no esta en la ruta (no se puede atribuir).
 *   VARIOS        → conserva: ubicacion ambigua (no se adivina cual es el de la ruta).
 */
export async function elegirControlEnRuta(
  context: AppContext,
  projectPath: string,
  ancla: string,
  controles: readonly string[]
): Promise<Resolucion> {
  const enRuta = controles.filter((c) => context.rutaDelControl.enRuta(projectPath, ancla, c))
  const uno = enRuta[0]
  if (enRuta.length === 1 && uno !== undefined) return { probar: uno }
  if (enRuta.length === 0)
    return { conservar: 'reclamacion incompleta: el control no esta en la ruta del hallazgo' }
  return { conservar: 'reclamacion incompleta: ubicacion ambigua del control en la ruta' }
}
