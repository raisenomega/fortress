/**
 * Los tres ejes de los que FORTRESS deriva la severidad (ADR-080). Vocabulario
 * CERRADO, como los tipos de defecto: el escaner ELIGE, no redacta. Es lo que
 * hace estable la banda entre corridas — con la frase de antes el mismo relay
 * de correo abierto fue MEDIUM y HIGH en dos escaneos.
 */

/** Quien llega hasta el defecto. */
export const ALCANCES = ['anonimo', 'autenticado', 'privilegiado', 'local'] as const
export type Alcance = (typeof ALCANCES)[number]

/** Que se lleva o rompe. Los cuatro primeros cruzan fuera del perimetro de
 *  quien ataca; los tres ultimos se quedan en lo propio o en lo publico. */
export const EFECTOS = [
  'dinero',
  'datos-de-terceros',
  'credenciales',
  'ejecucion',
  'integridad',
  'disponibilidad',
  'informacion'
] as const
export type Efecto = (typeof EFECTOS)[number]

/** Si funciona con el codigo de hoy. `explotable-hoy` ES la frase del 2 de
 *  agosto, ahora como valor de un eje y no como unica regla de banda. */
export const ESTADOS = ['explotable-hoy', 'requiere-condicion', 'defensa-en-profundidad'] as const
export type Estado = (typeof ESTADOS)[number]

export interface Ejes {
  readonly alcance: Alcance
  readonly efecto: Efecto
  readonly estado: Estado
}

/** Lo que llega del bloque JSON, sin validar. */
export interface EjesCrudos {
  readonly alcance?: unknown
  readonly efecto?: unknown
  readonly estado?: unknown
}

function enVocabulario<T extends string>(lista: readonly T[], valor: unknown): valor is T {
  return typeof valor === 'string' && (lista as readonly string[]).includes(valor)
}

/** El centinela es `null`: fuera del vocabulario no se adivina, como `aTipoDeDefecto` -> `otro`. */
export const aAlcance = (v: unknown): Alcance | null => (enVocabulario(ALCANCES, v) ? v : null)
export const aEfecto = (v: unknown): Efecto | null => (enVocabulario(EFECTOS, v) ? v : null)
export const aEstado = (v: unknown): Estado | null => (enVocabulario(ESTADOS, v) ? v : null)

/**
 * Los tres ejes validos, o `null`: si falta uno o viene fuera del vocabulario,
 * el hallazgo queda SIN EJES y conserva la severidad que dijo el modelo. Nada
 * cae a CRITICAL por una derivacion a medias.
 */
export function leerEjes(crudos: EjesCrudos): Ejes | null {
  const alcance = aAlcance(crudos.alcance)
  const efecto = aEfecto(crudos.efecto)
  const estado = aEstado(crudos.estado)
  if (alcance === null || efecto === null || estado === null) return null
  return { alcance, efecto, estado }
}
