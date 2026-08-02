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
  // Sin esto, una ANTHROPIC_API_KEY del entorno haria que los tests intentaran
  // una llamada real a la API y el resultado dependeria de la maquina.
  delete process.env.ANTHROPIC_API_KEY
}

/**
 * Ejecuta el composition root real y comprueba que sigue apuntando al userData
 * temporal. Si el main lo reasigna (app.setPath), los tests escribirian en la
 * base real del operador: ya paso una vez, y en silencio.
 */
function bootMainProcess() {
  require(join(OUT, 'main', 'index.js'))

  const actual = app.getPath('userData')
  if (actual === dataDir) return

  console.error(`HARNESS FAIL: la app uso ${actual} en vez del temporal ${dataDir}.`)
  console.error('Los tests escribirian en la base real; revisa main/index.ts.')
  app.exit(1)
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
