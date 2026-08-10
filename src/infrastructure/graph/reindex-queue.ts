/**
 * Cola FIFO de UN reindex a la vez a nivel de proceso: N proyectos al arrancar
 * no pueden desatar N indexados paralelos. De memoria, no persistida: si la app
 * muere, el on-boot re-evalua todo y los RUNNING huerfanos se reclaman por
 * STALE_MS. Un fallo de un trabajo no bloquea a los siguientes.
 */
export interface ReindexQueue {
  /** Devuelve lo que el job devuelva: la cola serializa, no traga resultados. */
  enqueue<T>(job: () => Promise<T>): Promise<T>
}

export function createReindexQueue(): ReindexQueue {
  let tail: Promise<unknown> = Promise.resolve()
  return {
    enqueue: <T>(job: () => Promise<T>): Promise<T> => {
      const turn = tail.then(job, job)
      tail = turn.catch(() => undefined)
      return turn
    }
  }
}

/** La cola unica del proceso FORTRESS. */
export const reindexQueue = createReindexQueue()
