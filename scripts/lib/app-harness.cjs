/**
 * Arranque compartido por los scripts de verificacion: levanta la app real
 * (main + preload + renderer compilados) contra un userData temporal, de modo
 * que nunca tocan la base de datos del operador.
 */
const { app, BrowserWindow } = require('electron')
const { join } = require('path')
const { mkdtempSync, rmSync } = require('fs')
const { tmpdir } = require('os')

const OUT = join(__dirname, '..', '..', 'out')

let dataDir = null

function useTemporaryUserData() {
  dataDir = mkdtempSync(join(tmpdir(), 'fortress-check-'))
  app.setPath('userData', dataDir)
}

/** Ejecuta el composition root real: registra los handlers IPC y abre la base. */
function bootMainProcess() {
  require(join(OUT, 'main', 'index.js'))
}

/**
 * Ventana con el mismo preload que la app. Se devuelve sin cargar para poder
 * suscribirse a los eventos de consola antes de que el renderer arranque.
 */
function createRendererWindow() {
  return new BrowserWindow({
    show: false,
    width: 1440,
    height: 900,
    webPreferences: {
      preload: join(OUT, 'preload', 'index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      offscreen: true
    }
  })
}

function loadRenderer(window) {
  return window.loadFile(join(OUT, 'renderer', 'index.html'))
}

function cleanup() {
  if (dataDir) rmSync(dataDir, { recursive: true, force: true })
  dataDir = null
}

module.exports = {
  useTemporaryUserData,
  bootMainProcess,
  createRendererWindow,
  loadRenderer,
  cleanup
}
