import type { MotivoCierre } from './motivo-cierre'

/**
 * Por que se corto, dicho para quien no lee vocabularios cerrados. Vive aparte
 * de la linea de la UI porque el informe no puede importar de `presentation`:
 * es el mismo texto y dos sitios lo necesitan, asi que su casa es el dominio.
 */
export const PORQUE_SE_CORTO: Record<MotivoCierre, string> = {
  completo: 'recorrido completo',
  abortado: 'lo detuvo el operador',
  fallo: 'el escaner fallo',
  timeout: 'se agoto el tiempo',
  presupuesto: 'se agoto el presupuesto'
}
