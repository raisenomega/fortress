import { clasificarExtincion, type ClaseDeExtincion } from '@domain/project/clase-de-extincion'
import type { FindingHistoria } from '@domain/project/finding-historia'

export interface LineaDeRecuento {
  readonly clase: ClaseDeExtincion
  readonly n: number
  readonly texto: string
}

/** Lo que cada numero puede afirmar. `verificado` es el unico que significa
 *  resuelto; los otros dos se cuentan aparte para que no lo parezcan. */
const TEXTO: Record<ClaseDeExtincion, string> = {
  verificado: 'verificados',
  fusionado: 'fusionados',
  'sin-prueba': 'sin prueba'
}

const ORDEN: readonly ClaseDeExtincion[] = ['verificado', 'fusionado', 'sin-prueba']

/**
 * Los TRES numeros de la historia, nunca uno solo.
 *
 * «55 resueltos» seria falso y es lo que sale de contar filas: solo ocho de las
 * cincuenta y cinco las cerro un juicio. Veinte son duplicados absorbidos y
 * veintisiete se cerraron en la era en que la ausencia extinguia. Un total unico
 * afirmaria de las tres lo que solo vale para una — el falso negativo de la CSP,
 * ahora en una cabecera.
 *
 * Se cuentan tambien las clases con CERO: que la historia diga «0 verificados»
 * es informacion, y esconderlo dejaria la cabecera contando solo lo que hay.
 */
export function recuentoDeHistoria(
  historia: readonly FindingHistoria[]
): readonly LineaDeRecuento[] {
  const porClase = new Map<ClaseDeExtincion, number>(ORDEN.map((c) => [c, 0]))
  for (const fila of historia) {
    const clase = clasificarExtincion(fila.extinctReason)
    porClase.set(clase, (porClase.get(clase) ?? 0) + 1)
  }
  return ORDEN.map((clase) => ({ clase, n: porClase.get(clase) ?? 0, texto: TEXTO[clase] }))
}
