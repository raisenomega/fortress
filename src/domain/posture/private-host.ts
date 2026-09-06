/**
 * Destinos que un escaner de exposicion NUNCA debe tocar: loopback, red privada,
 * link-local (incluye 169.254.169.254, los metadatos de la nube) y nombres
 * locales. Sin esto la app se vuelve un escaner de la red interna del operador,
 * activable desde el renderer o sugerible por la propia IA.
 */
import { aIpv4Punteada } from './ipv4-formas'
import { esReservada } from './rangos-reservados'
import { unmapIpv4 } from './unmap-ipv4'

/**
 * Los nombres que resuelven a esta maquina. `localhost` y `*.localhost` los
 * reserva la RFC 6761 para el loopback; `.local` es mDNS, la red de al lado.
 *
 * El PUNTO FINAL entra por separado, mas abajo: `localhost.` es la forma
 * absoluta del mismo nombre —el DNS la resuelve igual y `new URL` la conserva
 * tal cual— y este patron, anclado, no casaba con ella. Un filtro que se
 * esquiva escribiendo un punto no es un filtro.
 */
const LOCAL_NAME = /^(?:localhost|(?:[^.]+\.)+(?:local|localhost))$/i

export function isPrivateHost(hostname: string): boolean {
  // Se quita el disfraz ANTES de decidir: `::ffff:7f00:1` es 127.0.0.1, y sin
  // desenmascararlo no casaba con ninguna regla y pasaba por publico. El punto
  // final se quita aqui, junto a los corchetes del literal IPv6: las tres son
  // formas de escribir lo mismo, no direcciones distintas.
  const desnudo = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  const host = unmapIpv4(desnudo)
  if (LOCAL_NAME.test(host)) return true
  if (host === '::1' || host === '::') return true
  if (/^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true

  // Normalizada ANTES de mirarla: `2130706433`, `0x7f000001`, `0177.0.0.1` y
  // `127.1` son 127.0.0.1, y el decimal punteado era la unica forma que este
  // filtro conocia. Un `connect` las resuelve todas, asi que mirar solo una no
  // filtraba nada — bastaba con escribir la direccion de otro modo.
  //
  // Y los rangos salen de una TABLA con su RFC, no de una cadena de `if`: la
  // cadena cubria seis y se dejaba fuera nueve, CGNAT entre ellos.
  const punteada = aIpv4Punteada(host)
  return punteada !== null && esReservada(punteada)
}
