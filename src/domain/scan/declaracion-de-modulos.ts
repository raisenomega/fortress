import { esModuloAuditoria, type ModuloAuditoria } from './modulo-auditoria'

/**
 * Lo que el OPERADOR declara sobre los modulos que no se detectan por fichero
 * (ADR-083, decision 3). Parcial a proposito: un modulo ausente del objeto es
 * «no declarado», que NO es lo mismo que `false` —«declarado que no aplica»—.
 * Confundirlos convertiria el silencio en un descarte, que es justo lo que la
 * decision 4 prohibe.
 */
export type DeclaracionDeModulos = Partial<Record<ModuloAuditoria, boolean>>

/** El operador no ha dicho nada. Ni aplica ni deja de aplicar: no consta. */
export const SIN_DECLARACION: DeclaracionDeModulos = {}

const comoObjeto = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    // Una columna corrupta no puede tumbar un escaneo: sin declaracion se
    // sigue, y los modulos vuelven a «no consta», que es la verdad.
    return null
  }
}

/**
 * Del TEXT de la columna —o del objeto que manda el renderer— al vocabulario.
 * Molde `aTipoDeDefecto`: lo que no se reconoce no se adivina, se cae. Y cae
 * clave a clave, no entero: una entrada rara no borra las declaraciones buenas
 * que viajan con ella.
 */
export function aDeclaracion(value: unknown): DeclaracionDeModulos {
  const objeto = comoObjeto(value)
  if (typeof objeto !== 'object' || objeto === null) return SIN_DECLARACION

  const limpias = Object.entries(objeto).filter(
    ([clave, valor]) => esModuloAuditoria(clave) && typeof valor === 'boolean'
  )
  return Object.fromEntries(limpias) as DeclaracionDeModulos
}

/** Al TEXT de la columna. Se sanea antes de escribir, no al leer. */
export const escribirDeclaracion = (declaracion: DeclaracionDeModulos): string =>
  JSON.stringify(aDeclaracion(declaracion))
