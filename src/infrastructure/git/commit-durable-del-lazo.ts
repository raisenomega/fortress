import { mensajeDurable } from '@domain/build/commit-durable'
import { isFortressRepo } from '../system/self-project'
import { git } from './git-snapshot'

/** Como quedo el intento de commit durable: la UI/telemetria lo traduce. */
export type DesenlaceDurable = 'commiteado' | 'sin-cambios' | 'fortress' | 'error'

/**
 * El COMMIT DURABLE del lazo (ATERRIZAJE-4): tras un turno CONVERGIDO, persiste
 * el trabajo del agente en el arbol del CLIENTE con `fix(<id>): <titulo>`, UNO
 * atomico por turno. El arbol llega limpio (stash al arrancar), asi que `add -A`
 * toma SOLO lo del agente. Reglas duras:
 *  - NUNCA sobre FORTRESS (guard self-repo): el lazo es solo clientes.
 *  - Sin cambios -> NO hay commit vacio.
 *  - LOCAL: jamas pushea; el push sigue siendo humano y gateado por CRITICAL.
 *  - NO toca el checkpoint transitorio (firmado): el commit va ENCIMA, tras `conservar`.
 */
export function commitDurableDelLazo(
  cwd: string,
  findingId: string,
  titulo: string
): DesenlaceDurable {
  if (isFortressRepo(cwd)) return 'fortress'
  try {
    git(cwd, ['add', '-A'])
    if (git(cwd, ['diff', '--cached', '--name-only']).trim() === '') return 'sin-cambios'
    git(cwd, ['commit', '-m', mensajeDurable(findingId, titulo), '--no-verify'])
    return 'commiteado'
  } catch {
    return 'error'
  }
}
