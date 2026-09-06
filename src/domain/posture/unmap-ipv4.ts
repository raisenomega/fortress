/**
 * Un IPv4 puede llegar disfrazado de IPv6 de varias maneras, segun quien lo
 * escriba:
 *
 *   ::ffff:127.0.0.1   MAPEADA con puntos — la que devuelve `dns.lookup`
 *   ::ffff:7f00:1      MAPEADA en hexadecimal — la que produce `new URL(...)`
 *   ::127.0.0.1        COMPATIBLE, la forma vieja (RFC 4291, en desuso)
 *   0000:0000:...      la misma, escrita sin comprimir y con ceros de relleno
 *
 * Todas son 127.0.0.1. Reconocer solo una deja las demas pasando por publicas:
 * eso ya ocurrio una vez —el filtro miraba la de puntos, que el parser de URL
 * NUNCA produce, asi que `[::ffff:127.0.0.1]` atravesaba entero—.
 *
 * Que hoy `new URL` normalice casi todas no es motivo para reconocer solo esas:
 * este predicado responde una pregunta —que direccion hay detras— y una
 * respuesta equivocada es un fallo aunque el unico llamante de hoy la tape. El
 * llamante de manana puede venir de `dns.lookup`, que escribe de otra forma.
 */
const CEROS = '(?:0{1,4}:)'
const MAPPED = new RegExp(`^(?:::|${CEROS}{5})ffff:(.+)$`, 'i')
/** Sin el `ffff`: los 32 bits finales SON la IPv4. Todo `::/96` esta ademas
 *  fuera de internet, asi que desenmascarar aqui nunca clasifica de mas. */
const COMPAT = new RegExp(`^(?:::|${CEROS}{6})(.+)$`, 'i')
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
  // MAPPED primero: `::ffff:7f00:1` tambien encaja con COMPAT, y ahi el `ffff`
  // se leeria como parte de la direccion en vez de como el prefijo que es.
  const cola = MAPPED.exec(host)?.[1] ?? COMPAT.exec(host)?.[1]
  if (cola === undefined) return host

  if (DOTTED.test(cola)) return cola
  const hex = HEX_PAIR.exec(cola)
  return hex ? fromHex(hex[1], hex[2]) : host
}
