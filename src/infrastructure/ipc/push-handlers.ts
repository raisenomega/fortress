import { ipcMain } from 'electron'
import { pushProject } from '@application/push/push-project'
import { err, type Result } from '@domain/shared/result'
import { createGitPusher } from '../git/git-push'
import { isRepoRoot } from '../git/git-snapshot'
import { getAppContext } from '../persistence/app-context'
import { endMerge } from '../run-control'
import { guardMerge } from '../run-guard'
import { IPC } from './channels'

const NO_ES_RAIZ =
  'La carpeta del proyecto no es la raiz de su propio repositorio git: el push publicaria el repo padre.'

/**
 * La carpeta tiene que ser la RAIZ de su propio repo. Si es una subcarpeta de
 * un repo padre, `git push` sube por el arbol y publica el padre entero —su
 * rama activa, su remoto— cuando el operador creyo autorizar otra cosa.
 *
 * Se le pregunta a git (`isRepoRoot`, el mismo que usa el checkpoint) y no al
 * `gitRemote` guardado: ese campo es una foto en SQLite que entro por el canal
 * sin verificar. Todo fallo cuenta como "no es raiz": sin respuesta, no hay push.
 */
/**
 * El push pide el turno del MERGE, no el del motor. El recurso compartido aqui
 * no es el motor —publicar no spawnea nada ni gasta un token— sino la RAMA
 * ACTIVA: una firma reescribiendola mientras git la lee empuja al remoto un
 * estado intermedio que nadie juzgo. Con el turno del motor, en cambio, el
 * boton quedaria detras de cualquier escaneo, chat o drenaje del proyecto:
 * media hora cerrado sin que hubiera nada que proteger.
 *
 * `guardMerge` trae ademas el circuit breaker, y es lo que se quiere: un
 * proyecto CONTAMINADO esta bloqueado hasta revision humana antes de volver a
 * tocarlo, y publicarlo al remoto es tocarlo hacia afuera y sin vuelta atras.
 *
 * Las guardias van DELANTE de `pushProject`, asi que sus rechazos no dejan
 * asiento en el Libro de la Vida. Es una decision, no un descuido: el asiento
 * de OMEGA documenta el juicio sobre los CRITICAL citando evidencia de disco, y
 * ni un turno ocupado ni una carpeta ajena son un juicio sobre el proyecto.
 */
export function registerPushHandlers(): void {
  ipcMain.handle(IPC.pushRun, async (_event, projectId: string): Promise<Result<string>> => {
    const context = getAppContext()
    const ocupado = guardMerge(context, projectId)
    if (ocupado !== null) return err(ocupado)

    try {
      // Detras del turno: el proceso git extra no se paga en los rechazos.
      const project = context.projects.findById(projectId)
      if (project && !isRepoRoot(project.path)) return err(NO_ES_RAIZ)

      return await pushProject(context, createGitPusher(), projectId)
    } finally {
      // Soltar dentro del `finally`: `pushProject` retorna temprano si el
      // proyecto no existe o si `pushState` niega, y un `endMerge` en el camino
      // feliz dejaria el turno tomado hasta reiniciar la app.
      endMerge(projectId)
    }
  })
}
