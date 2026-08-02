import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from '@infrastructure/electron/main-window'
import { registerIpcHandlers } from '@infrastructure/ipc/register-handlers'
import { closeDatabase } from '@infrastructure/persistence/database'

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

/** Composition root: unico lugar donde se ensamblan las capas. */
app.whenReady().then(() => {
  electronApp.setAppUserModelId(APP_USER_MODEL_ID)
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  registerIpcHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Cerrar la base explicitamente asegura que WAL haga checkpoint al salir.
app.on('will-quit', closeDatabase)
