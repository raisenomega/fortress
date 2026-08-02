/**
 * Genera build/icon.png rasterizando el emblema con el propio Chromium de
 * Electron: sin dependencias de imagen ni binarios externos.
 *
 * Uso: npm run icon
 */
const { app, BrowserWindow } = require('electron')
const { join } = require('path')
const { writeFileSync } = require('fs')
const { PAGE, SIZE } = require('./lib/icon-svg.cjs')

const TARGET = join(__dirname, '..', 'build', 'icon.png')

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true }
  })

  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(PAGE)}`)
  await new Promise((resolve) => setTimeout(resolve, 500))

  const image = await window.webContents.capturePage()
  writeFileSync(TARGET, image.toPNG())

  const { width, height } = image.getSize()
  console.log(`ICON OK: ${TARGET} (${width}x${height})`)
  app.exit(width >= SIZE && height >= SIZE ? 0 : 1)
})
