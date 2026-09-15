import { BrowserWindow, ipcMain } from 'electron'
import { addProject } from '@application/project/add-project'
import { proyectosEnVista } from '@application/project/proyectos-en-vista'
import { removeProject } from '@application/project/remove-project'
import { setProjectLoopEnabled } from '@application/project/set-project-loop-enabled'
import { desbloquearContaminacion } from '@application/project/desbloquear-contaminacion'
import { setProjectTrusted } from '@application/project/set-project-trusted'
import { declararModulos } from '@application/project/declarar-modulos'
import { aDeclaracion } from '@domain/scan/declaracion-de-modulos'
import { startLoop, stopLoop } from '../loop/loop-controller'
import { exportProjectRecord } from '../project/export-record'
import type { NewProject } from '@domain/project/project'
import { RED_DE_REVERSION } from '../chat/red-de-reversion'
import { getAppContext } from '../persistence/app-context'
import { pickProjectFolder } from '../system/folder-picker'
import { isFortressRepo } from '../system/self-project'
import { IPC } from './channels'

// `resoluble` con las MISMAS sondas con las que `chat:send` decide el modo: la
// casilla del lote y el turno no pueden discrepar sobre si aqui se edita.
const SONDAS = { esRepoPropio: isFortressRepo, redGit: RED_DE_REVERSION.disponible }

export function registerProjectHandlers(): void {
  ipcMain.handle(IPC.projectsList, () => proyectosEnVista(getAppContext(), SONDAS))

  ipcMain.handle(IPC.projectsAdd, (_event, input: NewProject) => addProject(getAppContext(), input))

  ipcMain.handle(IPC.projectsRemove, (_event, id: string) => {
    const context = getAppContext()
    // Deja el record en la carpeta del proyecto ANTES de borrar sus datos (D7).
    const project = context.projects.findById(id)
    if (project) exportProjectRecord(context, project)
    return removeProject(context, id)
  })

  // trusted desbloquea el allowlist de Bash: se coacciona a booleano estricto
  // para que el renderer no lo active con un valor "truthy" cualquiera.
  // Revocar detiene el loop en curso (stopLoop): quitar la confianza es parar.
  ipcMain.handle(IPC.projectsSetTrusted, (_event, id: string, trusted: boolean) =>
    setProjectTrusted(getAppContext(), String(id), trusted === true, stopLoop)
  )

  // Lo que llega del renderer pasa por `aDeclaracion` antes de tocar nada, por
  // lo mismo que `trusted` se coacciona a booleano estricto: fuera del
  // vocabulario de modulos no se guarda nada, y una clave rara no borra las
  // buenas que viajan con ella.
  ipcMain.handle(IPC.projectsDeclararModulos, (_event, id: string, declaracion: unknown) =>
    declararModulos(getAppContext(), String(id), aDeclaracion(declaracion))
  )

  ipcMain.handle(IPC.projectsSetLoopEnabled, (_event, id: string, enabled: boolean) => {
    const result = setProjectLoopEnabled(getAppContext(), String(id), enabled === true, isFortressRepo) // prettier-ignore
    // El toggle arranca o para el loop de ese proyecto (aislado por proyecto).
    if (result.ok) (enabled ? startLoop : stopLoop)(id)
    return result
  })

  // Levantar el circuit breaker de la Capa 4. No lleva bandera: no es un toggle
  // que se apaga y se enciende, es un acto que se asienta una vez en el Libro.
  ipcMain.handle(IPC.projectsUnblock, (_event, id: string) =>
    desbloquearContaminacion(getAppContext(), String(id))
  )

  // El dialogo se ancla a la ventana que lo pidio para que sea modal.
  ipcMain.handle(IPC.projectsPickFolder, (event) =>
    pickProjectFolder(BrowserWindow.fromWebContents(event.sender))
  )
}
