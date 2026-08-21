import type { Project } from '../project/project'

/**
 * Si se puede EJECUTAR codigo del repo sobre este proyecto.
 *
 * La doctrina ya estaba escrita en `safe-commands.ts` —"`npm run <script>`
 * ejecuta lo que el package.json del repo AUDITADO defina; en un repo no
 * confiable eso seria ejecucion arbitraria"— y ya estaba implementada en
 * `audit-quality.ts`, que no corre sus probes sin confianza. Lo que faltaba era
 * aplicarla en las capas que se la habian saltado.
 *
 * Vive en el dominio y no dentro del gate porque no es una regla del gate: es la
 * linea que separa LEER un proyecto de EJECUTAR lo que trae. Leer no la pide
 * —escanear es justo lo que se hace ANTES de decidir si se confia—; ejecutar si.
 *
 * Un proyecto que ya no existe tampoco ejecuta: sin proyecto no hay confianza
 * que consultar, y el sesgo seguro es no correr.
 */
export function ejecutaConConfianza(project: Project | null | undefined): boolean {
  return project?.trusted === true
}
