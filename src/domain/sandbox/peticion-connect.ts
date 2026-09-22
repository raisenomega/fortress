/** Lo que el proxy entiende: un CONNECT a un host y un puerto, y nada mas. */
export interface Connect {
  readonly host: string
  readonly puerto: number
}

// `CONNECT host:puerto HTTP/1.x`, y el host con la forma de un nombre de DNS:
// letras, cifras, guiones y puntos. Ni IPs entre corchetes, ni usuario@, ni
// espacios raros. Lo que no case aqui no es una peticion: es basura.
const CONNECT = /^CONNECT ([a-z0-9.-]{1,253}):(\d{1,5}) HTTP\/1\.[01]\r\n/i

/**
 * La primera linea de lo que llega por el tunel, o null si no es un CONNECT
 * bien formado. Puro: el proxy decide con esto y con la tabla, nada mas.
 *
 * Solo CONNECT. Un `GET http://…` en claro seria pedirle al proxy que hable HTTP
 * por el cliente; los registros van por TLS, y TLS entra por CONNECT.
 */
export function leerConnect(cabecera: string): Connect | null {
  const m = CONNECT.exec(cabecera)
  if (m === null) return null
  const puerto = Number(m[2])
  return puerto >= 1 && puerto <= 65535 ? { host: (m[1] ?? '').toLowerCase(), puerto } : null
}

export const PUERTO_TLS = 443

/** Si el proxy deja pasar este CONNECT: host de la lista, y solo por el puerto
 *  TLS. Los registros hablan TLS; abrir otros puertos seria abrir otras cosas.
 *  El puerto se inyecta solo para que un test monte un registro local. */
export function permitido(
  peticion: Connect,
  hosts: readonly string[],
  puerto = PUERTO_TLS
): boolean {
  return peticion.puerto === puerto && hosts.includes(peticion.host)
}
