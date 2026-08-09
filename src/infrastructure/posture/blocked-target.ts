import { isPrivateHost } from '@domain/posture/private-host'

const PRIVATE = 'La direccion apunta a una IP interna o privada'
const MALFORMED = 'La direccion no es valida'

/**
 * Motivo por el que NO se debe conectar a esta URL, o null si se puede.
 *
 * Existe porque `safeLookup` no basta: `net.connect` solo llama a `lookup`
 * cuando el host es un NOMBRE. Con un literal (`127.0.0.1`, `[::ffff:7f00:1]`)
 * no hay DNS que resolver, la funcion no llega a ejecutarse y la unica defensa
 * era el filtro de texto de `parseTarget` — que no cubria la forma mapeada.
 * Resultado: `http://[::ffff:127.0.0.1]` conectaba (200 confirmado).
 *
 * Se comprueba SIEMPRE, tambien con nombres: para un nombre publico devuelve
 * null y el trabajo lo sigue haciendo `safeLookup` sobre la IP resuelta. Las
 * dos capas cubren los dos caminos y ninguna depende de la otra.
 */
export function blockedTarget(url: string): string | null {
  try {
    // `hostname` ya viene normalizado y sin corchetes en IPv4; isPrivateHost
    // quita los corchetes de IPv6 y desenmascara la forma mapeada.
    return isPrivateHost(new URL(url).hostname) ? PRIVATE : null
  } catch {
    return MALFORMED
  }
}
