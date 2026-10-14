import { estaProbado } from '@domain/repair/evidencia-obsolescencia'
import { elegirControlEnRuta } from './inferir-del-foco'
import type { Analysis } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'

/** Desenlace de resolver el fichero de prueba: probar UNO, o conservar con MOTIVO
 *  visible (nunca el MITIGATED generico silencioso, P2). */
export type Resolucion = { readonly probar: string } | { readonly conservar: string }

const AJENO = 'obsoleto segun el agente, pero el control citado no esta en la ruta del hallazgo'

/**
 * Que probar para la extincion, en el camino de VERIFY. `estaProbado` sigue
 * siendo el JUEZ final (byte-identico): aqui solo se ELIGE el candidato, por
 * CONECTIVIDAD DE IMPORTS a la ruta del hallazgo, no por `fix(<id>)` ni el ancla.
 *
 * `ausente` (la huella del defecto) se prueba SIEMPRE contra el ancla: el defecto
 * vivia ahi. La ruta por conectividad es para `presente` —el control pudo mudarse
 * al llamador o al gate y seguir en la ruta—. ADR-087 enmienda, P1+P2.
 */
export async function ficheroAProbar(
  context: AppContext,
  project: Project,
  analysis: Analysis,
  veredicto: Veredicto
): Promise<Resolucion> {
  const ancla = analysis.target.file
  const ev = analysis.evidencia
  if (veredicto.verdict !== 'OBSOLETO' || ev?.forma !== 'presente') return { probar: ancla }

  const controles = await context.rutaDelControl.controlesEnHead(project.path, ev.marcador)
  const citado = ev.file
  if (citado !== undefined && citado !== ancla) {
    // CITA EXPLICITA (P1): se honra SOLO si es un control real (presente+atribuido)
    // y esta EN LA RUTA. Una cita a un fichero ajeno NO rescata nada.
    const ok =
      controles.includes(citado) && context.rutaDelControl.enRuta(project.path, ancla, citado)
    return ok ? { probar: citado } : { conservar: `${AJENO}: ${citado}` }
  }
  // Cita ausente o == ancla: si el control vive en el ancla, cierra ahi como hoy.
  if (estaProbado(ev, context.filesystemProbe.contenido(project.path, ancla)).probado)
    return { probar: ancla }
  return elegirControlEnRuta(context, project.path, ancla, controles)
}
