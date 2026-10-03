import { LO_QUE_EL_GRAFO_NO_VE } from '../settings/lo-que-el-grafo-no-ve'

/**
 * Como se usa el grafo y como se sabe si va al dia. Solo nombra herramientas que
 * el servidor fijado EXPONE (`herramientas-del-grafo.test.ts` lo deriva): aqui
 * se citaron `index_status`, `check_index_coverage` y `detect_changes`, que no
 * existen en 0.9.0, y el analista las pidio 243 veces. Es el bloque mas largo del
 * prompt y el que menos cambia: no depende del hallazgo, asi que vive aparte y
 * el compositor se queda en lo que si varia.
 *
 * Lo que NO se le pide es que INDEXE. Indexar es una accion del operador, con
 * su gate: un agente que obedeciera dentro de un worktree de reparacion o de un
 * sandbox de genesis llenaria el catalogo de copias efimeras.
 */
export const EL_GRAFO: readonly string[] = [
  'GRAFO PRIMERO: usa get_architecture, search_graph, trace_path y get_code_snippet',
  'del servidor codebase-memory ANTES de leer archivos. Lee un archivo solo si el',
  'grafo no basta. Entender BARATO.',
  '',
  'Si el proyecto NO esta indexado, la primera consulta te lo dice: search_graph',
  'responde con la lista de proyectos indexados. Entonces sigue a mano con Read,',
  'Grep y Glob, y NO lo indexes tu: indexar es una accion del operador, con su',
  'gate. Que no lo este es un estado conocido y no un fallo de FORTRESS, asi que',
  'no hace falta anotarlo en "notes" — lo demas que te falte, si.',
  '',
  'El grafo puede ir retrasado respecto al disco, y no hay herramienta que lo',
  'diga: compara con el fichero real. El grafo dice DONDE mirar;',
  'el disco dice QUE hay hoy, y es lo que decide.',
  '',
  // Medido el 2026-10-03 contra el servidor real: `(?i)` devolvio total=0
  // sobre una funcion indexada; `[eE]...` devolvio 5. Falla EN SILENCIO y el
  // agente concluye «no existe» (backlog 61adf076).
  'OJO con name_pattern: los flags inline como `(?i)` NO casan nada y devuelven',
  'total=0 en silencio. Para ignorar mayusculas usa clases: `.*[eE]nsure.*`.',
  'Un total=0 con `(?i)` dentro no prueba ausencia: reescribe el patron.',
  '',
  LO_QUE_EL_GRAFO_NO_VE,
  ''
]
