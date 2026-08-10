import { createReindexQueue, type ReindexQueue } from '../graph/reindex-queue'

/**
 * D16 — UN gate a la vez a nivel de proceso: typecheck + test:unit comen CPU y
 * dos en paralelo se comerian la maquina. Misma disciplina (y misma fabrica)
 * que la cola del reindexado del grafo. No persiste: un gate interrumpido por
 * un cierre de la app NO se reintenta solo — el humano vuelve a pulsar.
 * Deuda I3.1: limpiar gates a medio ejecutar en reclaim-worktrees.
 */
export const gateQueue: ReindexQueue = createReindexQueue()
