import { REGLAS_DE_SECRETO } from './reglas-de-secreto'

/**
 * El objetivo de una herramienta para la linea EN VIVO: archivo, patron o
 * comando. Es EFIMERO: el acumulador lo emite por onChunk pero NO lo persiste,
 * asi que un secreto en un comando de Bash no llega ni a la base ni al timeline.
 * Aun asi se redacta, por si el operador mira la pantalla por encima del hombro.
 */
export interface ToolInput {
  readonly file_path?: string
  readonly command?: string
  readonly pattern?: string
  readonly query?: string
  readonly symbol?: string
  readonly path?: string
}

/**
 * Tacha lo que parezca secreto antes de mostrarlo o escribirlo.
 *
 * Cada regla trae SU reemplazo (ver `reglas-de-secreto`): unas tachan la
 * coincidencia entera y otras conservan un prefijo para que la linea siga siendo
 * legible, y no se puede auditar lo que no se ve.
 */
export function redactSecrets(text: string): string {
  return REGLAS_DE_SECRETO.reduce((acc, [re, rep]) => acc.replace(re, rep), text)
}

const MAX = 120

/**
 * Objetivo mostrable de una herramienta. Bash se redacta; el resto es una ruta o
 * un patron, seguro de ver. undefined si no hay nada util que ensenar.
 */
export function toolDetail(name: string, input: ToolInput | undefined): string | undefined {
  if (!input) return undefined
  const raw =
    name === 'Bash'
      ? input.command && redactSecrets(input.command)
      : (input.file_path ?? input.pattern ?? input.query ?? input.symbol ?? input.path)
  if (!raw) return undefined
  const flat = raw.replace(/\s+/g, ' ').trim()
  return flat.length > MAX ? flat.slice(0, MAX) + '...' : flat
}
