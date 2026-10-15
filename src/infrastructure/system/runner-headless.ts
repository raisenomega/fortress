import { drenarHastaOmega, type DrenajeResultado } from '@application/repair/drenar-hasta-omega'
import type { AppContext } from '@application/context'
import { construirDepsDelDrenaje } from '../repair/drenaje-deps'
import { isFortressRepo, selfProject } from './self-project'
import { alSalir } from './al-salir'

/** Lo que una pasada headless dejo: rehusada con su motivo, o el parte del drenaje. */
export type ResultadoHeadless =
  | { readonly rehusado: true; readonly motivo: string }
  | { readonly rehusado: false; readonly drenaje: DrenajeResultado }

/**
 * Una pasada acotada del drenaje SIN ventana (autonomia de TIEMPO, no de permiso):
 * drena los elegibles de FORTRESS-self y los deja ESPERA-FIRMA. El drenaje no
 * integra, no pushea y no firma —la cadena no lo alcanza—. Rehusa fail-closed si
 * no hay fuente FORTRESS-self (empaquetado) o no esta registrada como proyecto:
 * sin id no se drena nada a ciegas.
 */
export async function correrHeadless(ctx: AppContext): Promise<ResultadoHeadless> {
  if (selfProject() === null) {
    return { rehusado: true, motivo: 'sin fuente FORTRESS-self (empaquetado/.asar): nada que drenar' }
  }
  const self = ctx.projects.list().find((p) => isFortressRepo(p.path))
  if (self === undefined) {
    return { rehusado: true, motivo: 'FORTRESS-self no esta registrado como proyecto' }
  }
  const drenaje = await drenarHastaOmega(ctx, self.id, construirDepsDelDrenaje(ctx, self.id))
  return { rehusado: false, drenaje }
}

/** El parte a stdout: no hay chat. El motivo honesto de cada propuesta vive en su
 *  expediente (lo lee el operador al firmar); aqui, el resumen de la corrida. */
export function parteHeadless(r: ResultadoHeadless): string {
  if (r.rehusado) return `[headless] rehusado: ${r.motivo}`
  const d = r.drenaje
  const col = d.colisiones.length === 0 ? '' : ` · ${d.colisiones.length} colision(es) de fichero`
  return `[headless] drenaje fin=${d.fin}: ${d.trabajadas} trabajadas, ${d.acumuladas} esperando firma${col}`
}

/** El cierre propio: el MISMO apagado endurecido de la app (mata hijos + cierra la
 *  base con checkpoint + traza), reusado, no reimplementado. `alSalir` es idempotente. */
export const cerrarHeadless = (): void => alSalir()

/** Engancha el cierre a SEÑAL —NUNCA a `window-all-closed`, que sin ventana no
 *  dispara—: un runner de horas cierra limpio ante Ctrl-C o kill. */
export function engancharSenales(cerrar: () => void): void {
  process.once('SIGINT', cerrar)
  process.once('SIGTERM', cerrar)
}
