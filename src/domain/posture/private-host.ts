/**
 * Destinos que un escaner de exposicion NUNCA debe tocar: loopback, red privada,
 * link-local (incluye 169.254.169.254, los metadatos de la nube) y nombres
 * locales. Sin esto la app se vuelve un escaner de la red interna del operador,
 * activable desde el renderer o sugerible por la propia IA.
 */
import { aIpv4Punteada } from './ipv4-formas'
import { unmapIpv4 } from './unmap-ipv4'

const LOCAL_NAME = /^(localhost|[^.]+\.local)$/i

export function isPrivateHost(hostname: string): boolean {
  // Se quita el disfraz ANTES de decidir: `::ffff:7f00:1` es 127.0.0.1, y sin
  // desenmascararlo no casaba con ninguna regla y pasaba por publico.
  const host = unmapIpv4(hostname.toLowerCase().replace(/^\[|\]$/g, ''))
  if (LOCAL_NAME.test(host)) return true
  if (host === '::1' || host === '::') return true
  if (/^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host)) return true

  // Normalizada ANTES de mirarla: `2130706433`, `0x7f000001`, `0177.0.0.1` y
  // `127.1` son 127.0.0.1, y el decimal punteado era la unica forma que este
  // filtro conocia. Un `connect` las resuelve todas, asi que mirar solo una no
  // filtraba nada — bastaba con escribir la direccion de otro modo.
  const punteada = aIpv4Punteada(host)
  if (punteada === null) return false
  const [a, b] = punteada.split('.').map(Number)
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}
