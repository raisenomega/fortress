import { lookup, type LookupAddress, type LookupAllOptions } from 'dns'
import type { LookupFunction } from 'net'
import { isPrivateHost } from '@domain/posture/private-host'

const BLOCKED = 'La direccion resuelve a una IP interna o privada'
const EMPTY = 'La direccion no resolvio a ninguna IP'

/** `::ffff:127.0.0.1` es 127.0.0.1 disfrazado: se compara en su forma IPv4. */
function asIpv4(address: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address)
  return mapped ? mapped[1] : address
}

/** La primera IP privada de la resolucion, o null si todas son publicas. */
export function firstBlocked(addresses: readonly LookupAddress[]): string | null {
  const hit = addresses.find((entry) => isPrivateHost(asIpv4(entry.address)))
  return hit ? hit.address : null
}

/**
 * Resuelve el nombre y RECHAZA si alguna IP es interna. El filtro de
 * `parseTarget` solo ve el TEXTO del host: un dominio publico cuyo registro A
 * apunta a 127.0.0.1 o a 169.254.169.254 (metadatos de la nube) lo atraviesa.
 * Aqui se comprueba la IP real.
 *
 * Se devuelve LA MISMA resolucion ya validada para que Node no vuelva a
 * consultar el DNS: sin segunda consulta no hay ventana de rebinding entre
 * comprobar y conectar. Se rechaza si CUALQUIER IP es privada, no solo la
 * primera, porque una respuesta con varios registros se elige en el connect.
 */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  const all: LookupAllOptions = { ...options, all: true }

  lookup(hostname, all, (error, addresses) => {
    if (error) return callback(error, [])
    if (addresses.length === 0) return callback(new Error(EMPTY), [])

    const blocked = firstBlocked(addresses)
    if (blocked) return callback(new Error(`${BLOCKED} (${blocked})`), [])

    if (options.all === true) return callback(null, addresses)
    return callback(null, addresses[0].address, addresses[0].family)
  })
}
