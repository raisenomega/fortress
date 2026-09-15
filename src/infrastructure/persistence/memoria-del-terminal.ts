import type { MemoriaDelTerminalPort } from '@domain/project/memoria-del-terminal-port'
import type { Db } from './database'

const LEER = 'SELECT terminal_sesion AS sesion FROM findings WHERE id = ?'
const RECORDAR = 'UPDATE findings SET terminal_sesion = @sesion WHERE id = @id'
const OLVIDAR = 'UPDATE findings SET terminal_sesion = NULL WHERE id = ?'

/**
 * La sesion del productor por hallazgo, en su columna (ADR-088, Enmienda 2).
 * No mira el ciclo de vida: recordar una conversacion no depende de si el
 * hallazgo sigue activo, y un hallazgo que vuelve a la cola la reanuda.
 */
export function createMemoriaDelTerminal(db: Db): MemoriaDelTerminalPort {
  const leer = db.prepare(LEER)
  const recordar = db.prepare(RECORDAR)
  const olvidar = db.prepare(OLVIDAR)

  return {
    sesionDelTerminal: (findingId) =>
      (leer.get(findingId) as { sesion: string | null } | undefined)?.sesion ?? null,
    recordarSesionDelTerminal: (findingId, sesion) => void recordar.run({ id: findingId, sesion }),
    olvidarSesionDelTerminal: (findingId) => void olvidar.run(findingId)
  }
}
