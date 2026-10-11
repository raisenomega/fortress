import type { Result } from '../shared/result'

/**
 * Puertos para fijar el git de un proyecto DESDE FORTRESS (PASO 163, Sello 2a).
 * Hasta ahora el remoto y la identidad eran solo-heredados (se leían de
 * `.git/config`, nunca se escribían). Son dos puertos y no uno: dos operaciones
 * independientes, cada una con su adaptador y su guarda. Síncronos: escribir una
 * clave de config es instantáneo y local, no sale a la red como el push.
 */
export interface GitIdentitySetter {
  /** Fija user.name/user.email LOCALES al proyecto (jamás el git global). */
  setIdentity(projectPath: string, name: string, email: string): Result<string>
}

export interface GitRemoteSetter {
  /** Fija el `origin` del proyecto a `url` (lo crea si no existe). */
  setRemote(projectPath: string, url: string): Result<string>
}
