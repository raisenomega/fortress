/**
 * Los bloques IPv4 que NUNCA son alcanzables por internet, tomados del registro
 * de direcciones de proposito especial de la IANA (RFC 6890 y sus hermanas).
 *
 * Estan como TABLA y no como cadena de `if` a proposito. La version anterior
 * comprobaba seis rangos escritos a mano —`a === 10`, `a === 172 && b >= 16`— y
 * se dejaba fuera CGNAT, el bloque del IETF, el banco de pruebas, multicast y el
 * reservado que incluye la difusion. No por descuido: una condicion por rango
 * solo cubre los que alguien recordo teclear, y nadie recuerda quince.
 *
 * Anadir un bloque es anadir una linea de DATOS, con su RFC al lado. La
 * comprobacion es una sola y no se toca.
 *
 * Se incluyen tambien los tres TEST-NET y el relay 6to4 retirado, que no son
 * peligrosos en si: no estan delegados a nadie, asi que conectar ahi no lleva a
 * ningun servicio legitimo y sobra en la lista de destinos posibles.
 */
const RESERVADOS: readonly string[] = [
  '0.0.0.0/8', // RFC 1122 — "esta red"
  '10.0.0.0/8', // RFC 1918 — privada
  '100.64.0.0/10', // RFC 6598 — CGNAT del operador
  '127.0.0.0/8', // RFC 1122 — loopback
  '169.254.0.0/16', // RFC 3927 — link-local (incluye 169.254.169.254)
  '172.16.0.0/12', // RFC 1918 — privada
  '192.0.0.0/24', // RFC 6890 — asignaciones del IETF
  '192.0.2.0/24', // RFC 5737 — TEST-NET-1
  '192.88.99.0/24', // RFC 7526 — relay 6to4, retirado
  '192.168.0.0/16', // RFC 1918 — privada
  '198.18.0.0/15', // RFC 2544 — banco de pruebas
  '198.51.100.0/24', // RFC 5737 — TEST-NET-2
  '203.0.113.0/24', // RFC 5737 — TEST-NET-3
  '224.0.0.0/4', // RFC 5771 — multicast
  '240.0.0.0/4' // RFC 1112 — reservado (incluye 255.255.255.255)
]

/** Decimal punteado a entero sin signo. Las cuatro partes ya vienen validadas. */
function aEntero(punteada: string): number {
  return punteada.split('.').reduce((acc, octeto) => acc * 256 + Number(octeto), 0) >>> 0
}

/** La mascara de un prefijo. `>>> 0` porque en JS el desplazamiento da con signo
 *  y `/1` saldria negativo, que compararia mal contra una direccion alta. */
function mascara(bits: number): number {
  return bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
}

function dentroDe(direccion: number, bloque: string): boolean {
  const [base, bits] = bloque.split('/')
  const m = mascara(Number(bits))
  return ((direccion & m) >>> 0) === ((aEntero(base) & m) >>> 0)
}

/** Si esta IPv4 —en decimal punteado y ya normalizada— cae en un bloque que no
 *  sale a internet. */
export function esReservada(punteada: string): boolean {
  const direccion = aEntero(punteada)
  return RESERVADOS.some((bloque) => dentroDe(direccion, bloque))
}

/** Cuantos bloques cubre la tabla. Lo usa la prueba para notar un borrado. */
export const CUANTOS_BLOQUES = RESERVADOS.length
