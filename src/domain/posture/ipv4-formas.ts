/** Un octeto en cualquiera de las tres bases que `inet_aton` admite. */
const OCTETO = /^(0[xX][0-9a-fA-F]+|0[0-7]*|[1-9][0-9]*)$/

/** El valor de una parte, en la base que declare su prefijo. `null` si no es una. */
function valor(parte: string): number | null {
  if (!OCTETO.test(parte)) return null
  const base = /^0[xX]/.test(parte) ? 16 : /^0[0-7]/.test(parte) ? 8 : 10
  const n = Number.parseInt(parte, base)
  return Number.isNaN(n) ? null : n
}

/**
 * Una IPv4 escrita en cualquiera de las formas que el sistema operativo acepta,
 * normalizada a decimal punteado. `null` si no lo es.
 *
 * `127.0.0.1` no es la unica manera de escribir el loopback, y el filtro de
 * host privado solo conocia esa: `2130706433`, `0x7f000001`, `0177.0.0.1` y
 * `127.1` son la MISMA direccion y pasaban por publicas. Cualquier `connect`
 * las resuelve igual —`inet_aton` acepta las cuatro—, asi que un filtro que
 * solo mira el decimal punteado no filtra nada: basta con escribirlo de otro
 * modo. Es la misma leccion que la IPv4 mapeada en IPv6, en otra forma.
 *
 * Una a cuatro partes, y las de menos de cuatro NO son un error: `127.1` es
 * `127.0.0.1` porque la ultima parte absorbe los octetos que faltan.
 */
export function aIpv4Punteada(host: string): string | null {
  const partes = host.split('.')
  if (partes.length === 0 || partes.length > 4) return null

  const valores = partes.map(valor)
  if (valores.some((v) => v === null)) return null

  const nums = valores as number[]
  const ultimo = nums[nums.length - 1]
  const cabeza = nums.slice(0, -1)
  if (cabeza.some((n) => n > 255)) return null
  if (ultimo > 256 ** (4 - cabeza.length) - 1) return null

  const cola = [0, 0, 0, 0].slice(cabeza.length)
  const resto = cola.map((_, i) => Math.floor(ultimo / 256 ** (cola.length - 1 - i)) % 256)
  return [...cabeza, ...resto].join('.')
}
