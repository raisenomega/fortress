import { DEFECTOS_DE_CASA } from './defectos-de-casa'
import { DEFECTOS_DE_CODIGO_AJENO } from './defectos-de-codigo-ajeno'

/**
 * Vocabulario CERRADO de tipos de defecto. El escaner ELIGE de esta lista; no
 * redacta. Es la pieza que hace estable la identidad de un hallazgo (ADR-067).
 *
 * Cada tipo va con su definicion de una linea, y esa definicion VIAJA al prompt
 * (ADR-081): mandar 27 slugs desnudos era pedirle al modelo que eligiera por el
 * nombre. Una sola verdad — el contrato no copia estos textos, los emite.
 *
 * Dos origenes, a proposito separados: lo que salio del propio repo y lo que
 * hizo falta para codigo ajeno. `otro` cierra la lista porque es el ultimo
 * recurso, y su definicion lo dice.
 *
 * Congelado aqui como decision de producto. Anadir un tipo es cambiar el
 * contrato del escaner, y por eso no se hace a la ligera.
 */
export const DEFECTOS = {
  ...DEFECTOS_DE_CASA,
  ...DEFECTOS_DE_CODIGO_AJENO,
  otro: 'lo genuinamente inclasificable, y solo tras descartar los otros 26.'
} as const

export type TipoDeDefecto = keyof typeof DEFECTOS

/** El orden es el del prompt: casa, codigo ajeno y `otro` al final. */
export const TIPOS_DE_DEFECTO = Object.keys(DEFECTOS) as readonly TipoDeDefecto[]

/** Fuera del vocabulario no se inventa nada: cae a `otro`, y se nota. */
export function aTipoDeDefecto(value: unknown): TipoDeDefecto {
  return (TIPOS_DE_DEFECTO as readonly string[]).includes(value as string)
    ? (value as TipoDeDefecto)
    : 'otro'
}
