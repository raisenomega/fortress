import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from '@infrastructure/electron/main-window'
import { reconcileAllOnBoot } from '@infrastructure/graph/reconcile-service'
import { reclaimRepairWorktrees } from '@infrastructure/repair/reclaim-service'
import { resumeLoops } from '@infrastructure/loop/loop-controller'
import { bindLoopWindow } from '@infrastructure/loop/loop-registry'
import { bindGenesisWindow } from '@infrastructure/genesis/genesis-registry'
import { registerIpcHandlers } from '@infrastructure/ipc/register-handlers'
import { closeDatabase } from '@infrastructure/persistence/database'
import { augmentPath } from '@infrastructure/system/augment-path'

const APP_USER_MODEL_ID = 'com.fortress.command-center'
const DATA_DIR = 'fortress-command-center'

/**
 * El nombre visible de la app puede cambiar; la carpeta de datos no. Fijar el
 * nombre interno mantiene userData estable aunque se renombre el productName.
 *
 * Se usa setName y no setPath a proposito: setPath pisa cualquier ruta que ya
 * hubiera fijado quien arranca el proceso, y eso hacia que los scripts de
 * verificacion escribieran en la base real en vez de en su carpeta temporal.
 */
app.setName(DATA_DIR)

// Antes de que nada lance un proceso hijo: lanzada con doble click, la app
// hereda un PATH minimo y no encontraria claude, gh ni otras herramientas.
augmentPath()

/** Composition root: unico lugar donde se ensamblan las capas. */
app.whenReady().then(() => {
  electronApp.setAppUserModelId(APP_USER_MODEL_ID)
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerIpcHandlers()
  const mainWindow = createMainWindow()
  bindLoopWindow(mainWindow)
  bindGenesisWindow(mainWindow)
  // Reanuda los loops que quedaron vivos: nada se pierde tras un reinicio.
  resumeLoops()
  // Alinea el grafo de cada proyecto con su HEAD, en background y de a uno.
  reconcileAllOnBoot()
  // Worktrees huerfanos de reparaciones interrumpidas: se reconcilian aqui.
  reclaimRepairWorktrees()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Cerrar la base explicitamente asegura que WAL haga checkpoint al salir.
app.on('will-quit', closeDatabase)
