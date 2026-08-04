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

const SECRET: readonly RegExp[] = [
  /sk-ant-[\w-]{6,}/gi,
  /\b(api[_-]?key|key|token|secret|password|pwd)\s*[=:]\s*\S+/gi,
  /Bearer\s+\S+/gi,
  /\b[0-9a-f]{32,}\b/gi
]

/** Tacha lo que parezca secreto antes de mostrar un comando en vivo. */
export function redactSecrets(text: string): string {
  return SECRET.reduce((acc, re) => acc.replace(re, '***'), text)
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
