import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from '@infrastructure/electron/main-window'
import { focoDeVentana, reconcileAllOnBoot } from '@infrastructure/graph/reconcile-service'
import { reclaimRepairWorktrees } from '@infrastructure/repair/reclaim-service'
import { restoreKeepAwake } from '@infrastructure/system/restore-keep-awake'
import { resumeLoops } from '@infrastructure/loop/loop-controller'
import { bindLoopWindow } from '@infrastructure/loop/loop-registry'
import { bindGenesisWindow } from '@infrastructure/genesis/genesis-registry'
import { registerIpcHandlers } from '@infrastructure/ipc/register-handlers'
import { alSalir } from '@infrastructure/system/al-salir'
import { augmentPath } from '@infrastructure/system/augment-path'
import { capturarFallo, instalarEmbudoDeArranque } from '@infrastructure/system/embudo-de-arranque'
import { sumideroDeFallos } from '@infrastructure/system/sumidero-de-fallos'

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

// Antes de ensamblar nada: si el ensamblado revienta, ya hay quien lo anote
// (ADR-086). Hasta aqui, un fallo del arranque no dejaba rastro en ningun sitio.
instalarEmbudoDeArranque(process, sumideroDeFallos)

/** Composition root: unico lugar donde se ensamblan las capas. */
app
  .whenReady()
  .then(() => {
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
    // Y al VOLVER a la ventana: un pull o merge de fuera mueve HEAD sin avisar.
    app.on('browser-window-focus', () => focoDeVentana.ventanaActiva())
    // Worktrees huerfanos de reparaciones interrumpidas: se reconcilian aqui.
    reclaimRepairWorktrees()
    // El candado que el operador dejo pedido vuelve solo: si lo encendio para un
    // ejercicio largo, un reinicio a media faena no debe apagarselo en silencio.
    restoreKeepAwake()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })
  // ENCADENADO a ese mismo `.then`, no en una cadena nueva: si registerIpcHandlers
  // o las migraciones lanzan, la promesa se rechazaba y la app quedaba a medio
  // arrancar sin decirlo. Colgarlo de una llamada APARTE compila igual y no
  // serviria: seria otra promesa, y esa no se rechaza nunca.
  .catch((error) => capturarFallo(sumideroDeFallos, 'el ensamblado de la app', error))

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Sin hijos vivos (ninguno sobrevive a la app) y con la base cerrada (WAL checkpoint).
app.on('will-quit', alSalir)
