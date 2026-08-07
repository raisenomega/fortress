/**
 * Bloqueo de la auto-mejora sin grafo: la mision de FORTRESS es sostenible SOLO
 * con el grafo; sin el, cada episodio releeria el codigo a mano (10x tokens).
 * Por eso no se deja arrancar la auto-mejora hasta indexar el propio repo.
 */
export const GRAPH_REQUIRED_MSG =
  'Sin Knowledge Graph la auto-mejora consume 10x tokens. Instala el grafo primero.'
