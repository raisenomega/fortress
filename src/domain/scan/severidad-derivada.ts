import type { Severity } from '../shared/severity'
import { leerEjes, type Alcance, type Efecto, type Ejes, type EjesCrudos } from './ejes-de-severidad' // prettier-ignore

/** Desde donde se llega sin lo que un anonimo no tiene. `privilegiado` y
 *  `local` exigen algo mas que estar fuera, y por eso no cruzan a CRITICAL. */
const ALCANZABLE_DESDE_FUERA: readonly Alcance[] = ['anonimo', 'autenticado']

/** Los efectos que cruzan fuera del perimetro de quien ataca: el dinero no es
 *  suyo, los datos son de terceros, las credenciales abren lo ajeno, la
 *  ejecucion lo es todo. Un autenticado que altera lo PROPIO produce
 *  `integridad` o `informacion`, no estos cuatro — es "cruzar a datos ajenos"
 *  dicho en ejes, sin un cuarto eje. */
const CRUZA_EL_PERIMETRO: readonly Efecto[] = ['dinero', 'datos-de-terceros', 'credenciales', 'ejecucion'] // prettier-ignore

/**
 * La tabla de ADR-080: la PRIMERA fila que cuadra decide. Es codigo y no
 * prompt por lo mismo que el veredicto de OMEGA (ADR-023): los ejes son
 * evidencia, la regla es codigo. Mismos ejes, misma banda, en todas las
 * corridas.
 *
 *   defensa-en-profundidad                                   -> LOW
 *   requiere-condicion                                       -> MEDIUM
 *   explotable-hoy · anonimo|autenticado · cruza el perimetro -> CRITICAL
 *   explotable-hoy · cualquier otra combinacion               -> HIGH
 */
export function bandaDe(ejes: Ejes): Severity {
  if (ejes.estado === 'defensa-en-profundidad') return 'LOW'
  if (ejes.estado === 'requiere-condicion') return 'MEDIUM'
  if (ALCANZABLE_DESDE_FUERA.includes(ejes.alcance) && CRUZA_EL_PERIMETRO.includes(ejes.efecto)) {
    return 'CRITICAL'
  }
  return 'HIGH'
}

/** La banda derivada, o `null` SOLO si los ejes estan incompletos o fuera del
 *  vocabulario: la regla sin-ejes. */
export function severidadDerivada(crudos: EjesCrudos): Severity | null {
  const ejes = leerEjes(crudos)
  return ejes === null ? null : bandaDe(ejes)
}
