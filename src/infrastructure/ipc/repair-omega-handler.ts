import { ipcMain } from 'electron'
import { judgeAndIntegrate } from '@application/repair/judge-and-integrate'
import type { JuicioConIntegracion } from '@application/repair/juicio-con-integracion'
import { isFortressRepo } from '../system/self-project'
import { getAppContext } from '../persistence/app-context'
import { buildAutoMergeDeps } from '../repair/auto-merge-deps'
import { buildOmegaDeps } from '../repair/repair-deps'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

/**
 * I4 — OMEGA gasta modelo (lectura estricta): misma guardia por-proyecto que
 * toda corrida, y la cola de juicio (compartida con el gate) dentro de runOmega.
 *
 * El juicio y la integracion van DENTRO del guard: integrar es escribir en el
 * repo vivo, y dejarlo fuera abriria la ventana justo donde otra corrida podria
 * empezar. Lo que DECIDE si se integra vive en la capa de aplicacion; aqui solo
 * se arman las dependencias reales y se sostiene el carril del proyecto.
 *
 * El caso de uso informa de las dos cosas que hace y por el puente viajan las
 * DOS: el veredicto, y si ademas se integro. La adaptacion vive aqui, en la
 * frontera con el transporte. Que viajara solo el juicio dejaba a la interfaz
 * sin saber si el repo habia cambiado, y por eso el aviso de "integrada" se
 * deducia del estado anterior en vez de leerse de lo que paso.
 *
 * `esRepoPropio` baja como puerto: sobre el codigo de FORTRESS este boton juzga
 * y NO integra, porque el operador pidio un juicio y la integracion del codigo
 * propio exige su propia firma. La regla esta en la aplicacion; aqui solo se
 * responde a la pregunta, que es leer un package.json.
 */
export function registerRepairOmegaHandler(): void {
  ipcMain.handle(
    IPC.repairRunOmega,
    async (_event, proposalId: string): Promise<JuicioConIntegracion> => {
      const context = getAppContext()
      const proposal = context.repairProposals.findById(String(proposalId))
      if (!proposal) return { ok: false, reason: 'invalid_state', integrada: false }
      const busy = guardRun(context, proposal.projectId)
      if (busy !== null) return { ok: false, reason: busy, integrada: false }
      try {
        const deps = {
          omega: buildOmegaDeps(proposal.projectId),
          autoMerge: buildAutoMergeDeps(proposal.projectId),
          esRepoPropio: isFortressRepo
        }
        const juicio = await judgeAndIntegrate(context, proposal.id, deps)
        return { ...juicio.omega, integrada: juicio.merge?.applied === true }
      } finally {
        endRun(proposal.projectId)
      }
    }
  )
}
