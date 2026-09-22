/** Lo que sale de un comando de verificacion: su codigo y lo que escribio. */
export interface SalidaDelGate {
  readonly code: number
  readonly out: string
}

/** `sh` y `bash` devuelven 127 cuando el comando no existe. Es el codigo
 *  canonico de «aqui no hay con que», y no se confunde con un fallo del fix. */
const NO_EXISTE_EL_COMANDO = 127

/**
 * Si el gate no LLEGO a medir nada (ADR-091). No es lo mismo que medir y
 * encontrar algo roto: aqui la herramienta ni siquiera estaba.
 *
 * Dos formas, y las dos se vieron el 18-sep sobre el mismo proyecto:
 *
 *   `missing script` — el package.json no define esa intencion. Ya se daba por
 *   bueno antes de este ADR, pero se daba por VERDE, que era mentira: nadie
 *   habia comprobado nada.
 *
 *   `rc 127` / `not found` — el script EXISTE y la herramienta no. Medido en
 *   raisen-nucleo: `npm run typecheck` con `node_modules` ausente sale con 127
 *   y `sh: 1: tsc: not found`, que NO casa con `missing script`. Por esa
 *   rendija se colaba: el gate lo contaba como rojo, el turno revertia, y un
 *   fix correcto se perdia por el estado en que llego el proyecto.
 *
 * Se mira el codigo Y el texto: el 127 es la senal limpia, pero un runner que
 * envuelva el comando puede devolver otro codigo y dejar el `not found` en la
 * salida. Ante la duda se elige DESCONOCIDA, que es la respuesta honesta —
 * ni absuelve como el verde ni castiga como el rojo.
 */
export function noSePudoVerificar(salida: SalidaDelGate): boolean {
  return porQueNoSePudo(salida) !== null
}

/** Por que el gate no llego a medir: la CAUSA, para que el recibo la diga. */
export type MotivoSinVerificar = 'sin-script' | 'sin-herramienta' | 'sin-caja' | 'sin-enlaces'

// `EPERM … symlink`: el sistema de ficheros no admite enlaces —vfat, medido el
// 21-sep en un disco USB— y `npm` no puede crear `node_modules/.bin`. No es del
// fix: es del disco donde vive el proyecto. Un EPERM sobre otra cosa NO entra.
const SIN_ENLACES = /EPERM[^\n]*symlink/i

export function porQueNoSePudo(salida: SalidaDelGate): MotivoSinVerificar | null {
  if (/^sin-caja:/.test(salida.out)) return 'sin-caja'
  if (/missing script/i.test(salida.out)) return 'sin-script'
  if (SIN_ENLACES.test(salida.out)) return 'sin-enlaces'
  if (salida.code === NO_EXISTE_EL_COMANDO || /\bnot found\b/i.test(salida.out))
    return 'sin-herramienta'
  return null
}
