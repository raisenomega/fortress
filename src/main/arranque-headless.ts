import { app } from 'electron'
import { arrancarGrafo } from '@infrastructure/graph/arranque-del-grafo'
import { reclaimRepairWorktrees } from '@infrastructure/repair/reclaim-service'
import { getAppContext } from '@infrastructure/persistence/app-context'
import { cerrarHeadless, correrHeadless, engancharSenales, parteHeadless } from '@infrastructure/system/runner-headless' // prettier-ignore

/** ¿Se pidio arrancar sin ventana? Flag de operador sobre el checkout de fuente. */
const esHeadless = (argv: readonly string[]): boolean => argv.includes('--headless')

/**
 * El boot SIN ventana: lo minimo que el drenaje necesita (grafo + barrido de
 * worktrees huerfanos), una pasada acotada, el parte a stdout, y el cierre propio
 * por el apagado endurecido —enganchado a SEÑAL, nunca a `window-all-closed`, que
 * sin ventana no dispara—. Al terminar, sale.
 */
async function correr(): Promise<void> {
  engancharSenales(() => {
    cerrarHeadless()
    app.exit(0)
  })
  arrancarGrafo(app.getPath('userData'))
  reclaimRepairWorktrees()
  console.log(parteHeadless(await correrHeadless(getAppContext())))
  cerrarHeadless()
  app.exit(0)
}

/** Si `--headless`, arranca el runner (fire-and-forget: termina con `app.exit`) y
 *  avisa al composition root de que NO monte la ventana. */
export function arranqueHeadlessSiPedido(argv: readonly string[]): boolean {
  if (!esHeadless(argv)) return false
  void correr()
  return true
}
