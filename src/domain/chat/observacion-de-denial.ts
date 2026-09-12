import type { AreaDeObservacion } from '../system/area-de-observacion'
import type { SelfNoteDraft } from '../system/self-observation'

/**
 * De que parte de FORTRESS habla una herramienta denegada. Determinista y
 * cerrado: el `tool_name` viene del CLI y no lo redacta nadie, asi que un mapa
 * basta y no hace falta juicio — al reves que el `area` de las 350 viejas.
 *
 * El prefijo `mcp__codebase-memory__` es el grafo, y dentro de el se distingue
 * lo que CONSULTA de lo que MANTIENE EL INDICE: son las dos clases que el corpus
 * separo (75 y 52 observaciones) y el operador ya se topo con las dos.
 */
const POR_HERRAMIENTA: ReadonlyArray<readonly [RegExp, AreaDeObservacion]> = [
  [/^mcp__codebase-memory__(index|detect_changes|check_index|list_projects|delete_project)/, 'indice-del-grafo'], // prettier-ignore
  [/^mcp__codebase-memory__/, 'consulta-del-grafo'],
  [/^(Bash|Read|Write|Edit|Grep|Glob|NotebookEdit|WebFetch|WebSearch|Task)$/, 'permisos-de-herramienta'] // prettier-ignore
]

/**
 * Lo que FORTRESS aprende cuando le niega una herramienta a su propio agente
 * (ADR-085, fase de los interactivos).
 *
 * Sale del DATO, no de la prosa: el CLI dice en `permission_denials` que se
 * bloqueo, asi que no hace falta ni preguntarle al modelo —un spawn por turno
 * que el 89 % de las veces responderia «no»— ni pedirle un bloque en su
 * respuesta, que el operador veria teclearse porque el chat emite EN VIVO.
 *
 * SEGURA POR CONSTRUCCION: solo el nombre de la herramienta. El comando lleva
 * rutas del cliente —los denials reales de la base traen `/home/jojo/...`— y
 * queda fuera a proposito. Esta nota no necesita que el cerco la salve; no tiene
 * nada que redactar.
 *
 * Una herramienta que no mapea cae a `otro`, que es el cajon declarado: se ve,
 * se cuenta, y avisa de que hay una familia nueva sin clase.
 */
export function observacionDeDenial(toolName: string, modo: string): SelfNoteDraft {
  const area = POR_HERRAMIENTA.find(([re]) => re.test(toolName))?.[1] ?? 'otro'
  return {
    kind: 'limitacion',
    area,
    note: `FORTRESS le nego la herramienta ${toolName} al agente en modo ${modo}`
  }
}

/** Las de un turno, sin repetir: el mismo `Bash` denegado siete veces en una
 *  respuesta es UN limite, no siete. La dedup de la base tambien lo funde, pero
 *  hacerlo aqui ahorra siete escrituras por turno. */
export function observacionesDeDenials(
  toolNames: readonly string[],
  modo: string
): readonly SelfNoteDraft[] {
  return [...new Set(toolNames)].map((nombre) => observacionDeDenial(nombre, modo))
}
