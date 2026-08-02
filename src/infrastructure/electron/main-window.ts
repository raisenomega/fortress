import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { isSafeExternalUrl } from '@domain/shared/safe-url'
import icon from '../../../resources/icon.png?asset'

const RENDERER_URL_ENV = 'ELECTRON_RENDERER_URL'

/**
 * Abre enlaces externos en el navegador del sistema, nunca dentro de la app, y
 * solo si son web: openExternal acepta cualquier esquema, incluido file://.
 */
function denyInAppNavigation(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Segunda valla: nada puede sacar a la ventana de su propia interfaz.
  window.webContents.on('will-navigate', (event, url) => {
    if (url === window.webContents.getURL()) return
    event.preventDefault()
    if (isSafeExternalUrl(url)) void shell.openExternal(url)
  })
}

function loadRenderer(window: BrowserWindow): void {
  const devUrl = process.env[RENDERER_URL_ENV]
  if (is.dev && devUrl) {
    window.loadURL(devUrl)
    return
  }
  window.loadFile(join(__dirname, '../renderer/index.html'))
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0c10',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.on('ready-to-show', () => window.show())
  denyInAppNavigation(window)
  loadRenderer(window)
  return window
}
