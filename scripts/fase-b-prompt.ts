import { readFileSync } from 'fs'
import { join } from 'path'
import { TIPOS_DE_DEFECTO } from '../src/domain/scan/tipo-de-defecto.ts'

/**
 * La prediccion, escrita ANTES de mirar lo que devuelva el modelo. Sale de leer
 * los TITULOS, que son justo lo inestable, asi que va como hipotesis falsable y
 * no como hecho: si la salida se desvia, no fallo el script — es que el
 * reclasificador no ve lo mismo que el escaner, y eso hay que mirarlo.
 */
export const PREDICCION: readonly string[] = [
  '3->1  allowed-files.ts: las 2 viejas + la nueva path-traversal|computeallowedfiles',
  '2->1  claude-cli.ts: la vieja ".mcp.json viaja entero en argv" + la nueva secret-in-argv|buildargs', // prettier-ignore
  '2->1  claude-cli.ts (vieja-vieja): "API key se hereda al entorno" + "buildEnv hereda el entorno completo" -> secret-in-env|buildenv', // prettier-ignore
  '2->1  project-path.ts (vieja-vieja): las dos de isAbsoluteProjectPath',
  'NO    claude-cli.ts: "no pasa --strict-mcp-config" — otro defecto, y ademas obsoleto (la linea 45 si lo pasa)' // prettier-ignore
]

/**
 * La regla del simbolo, LEIDA del contrato real en vez de reescrita.
 *
 * `report-contract.ts` no se puede importar desde un script suelto —su
 * `'./tipo-de-defecto'` sin extension no resuelve—, asi que se lee como texto y
 * se recorta desde el marcador. Si el marcador desaparece esto revienta, que es
 * lo que tiene que pasar: un prompt sin la regla clasificaria a ciegas.
 */
function reglaDelSimbolo(raiz: string): string {
  const fuente = readFileSync(join(raiz, 'src/domain/scan/report-contract.ts'), 'utf8')
  const desde = fuente.indexOf('- simbolo:')
  const hasta = fuente.indexOf('`', desde)
  if (desde === -1 || hasta === -1) throw new Error('report-contract.ts ya no dice "- simbolo:"')
  return fuente.slice(desde, hasta).trim()
}

export interface ItemAClasificar {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
}

/**
 * SOLO pide tipo y simbolo. Ni titulo ni severidad: el titulo se reescribe cada
 * corrida y no entra en la identidad, y la severidad si mueve el score — una
 * pieza que viene a estabilizar identidades no toca el tablero de paso.
 */
export function promptDeClasificacion(raiz: string, items: readonly ItemAClasificar[]): string {
  return `Clasifica ${items.length} hallazgos que YA existen en la base de FORTRESS.
Para cada uno devuelve su tipo y su simbolo. Lee el fichero y la linea que se
indican antes de decidir el simbolo. NO cambies el titulo ni la severidad.

- tipo: ELIGE uno de esta lista, no inventes ninguno. Si de verdad no encaja,
  pon "otro"; es preferible a forzar un tipo que no es.
${TIPOS_DE_DEFECTO.map((t) => `  · ${t}`).join('\n')}
${reglaDelSimbolo(raiz)}

LOS HALLAZGOS:
${JSON.stringify(items, null, 1)}

Termina SIEMPRE tu respuesta con este bloque, y nada despues:

\`\`\`json
{"clasificados":[{"id":"<el id tal cual>","tipo":"path-traversal","simbolo":"computeAllowedFiles"}]}
\`\`\``
}
