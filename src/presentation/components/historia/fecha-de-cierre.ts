import { formatMoment } from '../../format/time'

/** Lo que se escribe cuando no hay fecha. No es un hueco por rellenar: es la
 *  fila diciendo que nunca se resolvio. */
export const NO_SE_RESOLVIO = 'no se resolvio'

/**
 * La fecha en que se cerro un hallazgo, o la verdad de que no se cerro.
 *
 * Veinte de las cincuenta y cinco extinciones tienen `resolved_at` en null a
 * proposito: son fusiones, y «se fusiono, y un `resolved_at` afirmaria lo que no
 * paso». Rellenar ese hueco con cualquier otra fecha —la de la fusion, la del
 * ultimo escaneo— convertiria una ausencia deliberada en un dato inventado.
 *
 * Funcion aparte y no un ternario en el JSX para que esto se pueda probar: la
 * app no tiene entorno DOM, asi que lo que viva dentro de un componente no se
 * verifica, y esta decision es justo la que no puede fallar en silencio.
 */
export function fechaDeCierre(resolvedAt: string | null): string {
  return resolvedAt === null ? NO_SE_RESOLVIO : formatMoment(resolvedAt)
}
