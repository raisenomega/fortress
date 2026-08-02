import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from '@infrastructure/electron/main-window'

const APP_USER_MODEL_ID = 'com.fortress.command-center'

/** Composition root: unico lugar donde se ensamblan las capas. */
app.whenReady().then(() => {
  electronApp.setAppUserModelId(APP_USER_MODEL_ID)
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
