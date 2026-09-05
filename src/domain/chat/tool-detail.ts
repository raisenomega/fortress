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
 * Por el NOMBRE de lo que se asigna. Llevaba `\b` delante y el `\b` no existe
 * entre dos caracteres de palabra: en `GITHUB_TOKEN` no hay frontera entre el
 * `_` y la `T`, asi que NINGUN token con prefijo se tachaba. Medido:
 * `GITHUB_TOKEN=ghp_...`, `GH_TOKEN=`, `MI_SECRET=` y `npm_config_token=`
 * pasaban enteros. La `ANTHROPIC_API_KEY` se salvaba de casualidad, por el
 * patron `sk-ant-` de abajo y no por su nombre.
 *
 * Ahora basta con que la palabra no venga pegada a otra LETRA, que es lo que
 * distingue `_KEY=` de `monkey=`. Sin eso, la version amplia tachaba `monkey`,
 * `donkey`, `turkey` y `keyboard`: acotar de mas destroza texto legitimo, y un
 * comando tachado entero no se puede leer ni auditar.
 */
const POR_NOMBRE =
  /(?<![A-Za-z])(?:api[_-]?key|key|token|secret|password|passwd|pwd|credentials?)\s*[=:]\s*\S+/gi

/** Por la FORMA del valor, para los que se reconocen sin ver su nombre: viajan
 *  sueltos en una URL, en un log o en la salida de un agente. */
const POR_VALOR: readonly RegExp[] = [
  /sk-ant-[\w-]{6,}/gi,
  /\bgh[pousr]_[A-Za-z0-9]{16,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /Bearer\s+\S+/gi,
  /\b[0-9a-f]{32,}\b/gi
]

const SECRET: readonly RegExp[] = [POR_NOMBRE, ...POR_VALOR]

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
