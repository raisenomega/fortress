/**
 * Un IPv4 puede llegar disfrazado de IPv6 y en DOS formas distintas, segun
 * quien lo escriba:
 *
 *   ::ffff:127.0.0.1   forma con puntos — la que devuelve `dns.lookup`
 *   ::ffff:7f00:1      forma hexadecimal — la que produce `new URL(...)`
 *
 * Las dos son 127.0.0.1. Reconocer solo una deja la otra pasando por publica:
 * eso es exactamente lo que ocurria — el filtro miraba la forma con puntos, que
 * el parser de URL NUNCA produce, asi que `[::ffff:127.0.0.1]` atravesaba entero.
 */
const MAPPED = /^(?:::|(?:0:){5})ffff:(.+)$/i
const DOTTED = /^\d{1,3}(?:\.\d{1,3}){3}$/
const HEX_PAIR = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i

function fromHex(high: string, low: string): string {
  const a = Number.parseInt(high, 16)
  const b = Number.parseInt(low, 16)
  return `${a >> 8}.${a & 0xff}.${b >> 8}.${b & 0xff}`
}

/**
 * Devuelve el IPv4 que hay detras de un literal mapeado, o el host tal cual si
 * no lo es. No valida nada: solo quita el disfraz para que quien decida vea la
 * direccion real.
 */
export function unmapIpv4(host: string): string {
  const mapped = MAPPED.exec(host)
  if (!mapped) return host

  const tail = mapped[1]
  if (DOTTED.test(tail)) return tail

  const hex = HEX_PAIR.exec(tail)
  return hex ? fromHex(hex[1], hex[2]) : host
}
