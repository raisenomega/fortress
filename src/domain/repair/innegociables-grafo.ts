/**
 * La pared del grafo por turno (ADR-095, enmienda): el servidor del grafo de un
 * turno de clase A solo alcanza un directorio con la copia del proyecto. Cuatro
 * ficheros y los cuatro son defensa: la palanca en la entrada del servidor, el
 * segundo camino (el GRAPH propio del motor), la copia real con su ciclo de vida
 * y la raiz donde vive. Un fix que quitara el env de uno solo dejaria el muro a
 * medias, y nadie lo veria: el turno seguiria funcionando, sobre la cache real.
 */
export const DEFENSAS_DEL_GRAFO_POR_TURNO: readonly string[] = [
  'src/domain/connectors/graph-mcp.ts',
  'src/infrastructure/repair/generator-args.ts',
  'src/infrastructure/graph/grafo-del-turno.ts',
  'src/infrastructure/graph/raiz-de-grafos-de-turno.ts',
  'src/domain/repair/innegociables-grafo.ts'
]
