/**
 * Como se usa el grafo y como se sabe si va al dia. Es el bloque mas largo del
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
  'Si el proyecto NO esta indexado, index_status te lo dice en una llamada, sin',
  'descubrirlo a base de consultas que fallan. Entonces sigue a mano con Read,',
  'Grep y Glob, y NO lo indexes tu: indexar es una accion del operador, con su',
  'gate. Que no lo este es un estado conocido y no un fallo de FORTRESS, asi que',
  'no hace falta anotarlo en "notes" — lo demas que te falte, si.',
  '',
  'check_index_coverage dice si el indice cubre un fichero y si esta al dia',
  'respecto al disco; detect_changes, con since, dice que cambio desde una fecha.',
  'Son la via para saber si el grafo va retrasado sin abrir el fichero a ciegas.',
  ''
]
