/**
 * Se inyecta en TODO prompt de agente (incluido OMEGA). Usar el grafo del
 * proyecto (MCP codebase-memory) ANTES de leer archivos a mano es lo que hace
 * sostenible el gasto: leer el codebase entero cada escaneo cuesta millones de
 * tokens de cache; el grafo responde lo mismo por una fraccion. No negociable.
 */
export const GRAPH_FIRST =
  'GRAFO PRIMERO (no negociable): antes de leer archivos con Read o buscar con ' +
  'Grep, consulta el grafo del proyecto por el MCP codebase-memory. Si es la ' +
  'primera vez, corre index_repository sobre la raiz; luego get_architecture para ' +
  'el mapa, search_graph para localizar simbolos y trace_path para ver quien llama ' +
  'a que. Abre un archivo entero SOLO si el grafo no da la respuesta. Leer todo el ' +
  'codigo a mano quema tokens sin sentido.'
