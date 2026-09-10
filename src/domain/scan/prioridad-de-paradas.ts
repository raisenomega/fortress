import type { ParadaDeCarpeta } from './manifiesto'

/**
 * Las carpetas que se auditan PRIMERO. Nombres, no grafo: la aplicacion no
 * puede consultar el indice —solo cuenta filas— y el grafo llega por MCP al
 * agente, no a FORTRESS (ADR-082, Enmienda 1). Una heuristica de nombres es
 * determinista, auditable, no cuesta un spawn, y funciona igual en un proyecto
 * SIN grafo, que es donde la promesa original habria estado apagada.
 */
const SENSIBLES = [
  'auth', 'authz', 'authentication', 'login', 'session', 'sesion',
  'payment', 'pago', 'billing', 'checkout', 'invoice',
  'identity', 'user', 'usuario', 'account', 'cuenta',
  'security', 'seguridad', 'credential', 'credencial', 'secret', 'password',
  'permission', 'permiso', 'admin', 'token',
  'migration', 'migracion', 'schema', 'db', 'database'
] // prettier-ignore

/**
 * Por SEGMENTO y por prefijo, no por subcadena de la ruta entera: asi `authz`
 * y `payments` entran, y `controllers` no entra por «rol» ni `browser` por
 * «user». Una carpeta se toca una vez y el nombre lo dice.
 */
function esSensible(carpeta: string): boolean {
  const segmentos = carpeta.toLowerCase().split('/')
  return segmentos.some((s) => SENSIBLES.some((palabra) => s.startsWith(palabra)))
}

/**
 * El orden del RECORRIDO: las zonas sensibles delante. No es el orden del
 * manifiesto —ese es alfabetico y estable, para que dos manifiestos del mismo
 * arbol sean iguales—; es la prioridad, y vive aqui para que nadie la herede
 * asumida.
 *
 * **Cambia que se audita ANTES, nunca cuantas.** El compromiso es con las XX
 * paradas y se completan todas (Enmienda 2); si el operador para a mitad, esto
 * decide que alcanzo a mirarse. Partition estable: dentro de cada mitad se
 * conserva el orden que traia el manifiesto.
 */
export function ordenarPorSensibilidad(
  paradas: readonly ParadaDeCarpeta[]
): readonly ParadaDeCarpeta[] {
  return [
    ...paradas.filter((p) => esSensible(p.carpeta)),
    ...paradas.filter((p) => !esSensible(p.carpeta))
  ]
}
