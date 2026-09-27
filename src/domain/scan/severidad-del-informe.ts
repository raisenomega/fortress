import { isSeverity, type Severity } from '../shared/severity'

/**
 * La severidad que escribe el MODELO, llevada a la escala de FORTRESS.
 *
 * Existe aparte de `isSeverity` porque las dos puertas no pueden ser igual de
 * estrictas, y confundirlas costo un agujero. `isSeverity` valida lo que se lee
 * de la BASE, donde una severidad en minuscula seria una fila corrupta y tiene
 * que chirriar. Aqui se valida lo que dice un LLM, y un `high` en vez de `HIGH`
 * era un hallazgo REAL descartado en silencio: el contrato pide las mayusculas
 * («exactamente CRITICAL, HIGH, MEDIUM o LOW», report-contract), pero cumplirlo
 * no depende de nosotros y el precio de no tolerarlo lo pagaba el operador —con
 * todas las entradas asi, el informe entero pasaba por «proyecto limpio».
 *
 * Tolera la CAJA y los espacios, nada mas. Una palabra fuera de la escala sigue
 * devolviendo null: no se adivina ninguna severidad, igual que `aTipoDeDefecto`
 * no adivina ningun tipo.
 */
export function severidadDelInforme(value: unknown): Severity | null {
  if (typeof value !== 'string') return null

  const enEscala = value.trim().toUpperCase()
  return isSeverity(enEscala) ? enEscala : null
}
