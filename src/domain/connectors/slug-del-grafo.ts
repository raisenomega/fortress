/**
 * Como se llama un proyecto DENTRO del grafo. El servidor codebase-memory no usa
 * la ruta: usa la ruta aplanada, sin la barra inicial y con las demas vueltas
 * guiones — `/home/jojo/Escritorio/mailbd-main` es `home-jojo-Escritorio-mailbd-main`.
 *
 * Existe porque al agente se le daba `fichero:linea` y nunca este nombre, y sin
 * el ninguna consulta al grafo resuelve. La ruta de descubrimiento era penosa:
 * pedir `list_projects` (denegado hasta hoy por la allowlist corta) y, al fallar,
 * leer el nombre del MENSAJE DE ERROR de `search_graph`, que lo lista de pista.
 * Una ronda entera de turnos para averiguar un dato que se deduce de la ruta.
 *
 * Va como PISTA y no como verdad: el esquema lo decide el servidor, no nosotros,
 * y si algun dia cambia, el agente tiene `list_projects` para desmentirlo — que
 * ahora si puede llamar. Acertar ahorra turnos; fallar no rompe nada.
 */
export function slugDelGrafo(projectPath: string): string {
  return projectPath.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\//g, '-')
}
