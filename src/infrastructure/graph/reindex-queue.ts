/**
 * Cola FIFO de UN reindex a la vez a nivel de proceso: N proyectos al arrancar
 * no pueden desatar N indexados paralelos. De memoria, no persistida: si la app
 * muere, el on-boot re-evalua todo y los RUNNING huerfanos se reclaman por
 * STALE_MS. Un fallo de un trabajo no bloquea a los siguientes.
 */
export interface ReindexQueue {
  enqueue(job: () => Promise<void>): Promise<void>
}

export function createReindexQueue(): ReindexQueue {
  let tail: Promise<void> = Promise.resolve()
  return {
    enqueue: (job) => {
      const turn = tail.then(job, job)
      tail = turn.catch(() => undefined)
      return turn
    }
  }
}

/** La cola unica del proceso FORTRESS. */
export const reindexQueue = createReindexQueue()
