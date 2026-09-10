import type { ModuloAuditoria } from './modulo-auditoria'

/**
 * Los modulos que se auditan DENTRO de una carpeta (ADR-083). M9 mira la UI,
 * M8 la logica de valor y M3 los datos: los tres hablan de codigo que vive en
 * un sitio, y ese sitio es una parada.
 *
 * Los otros —M2 DR/BCP, M7 SDLC, M4 supply-chain, M11 continuidad, M12
 * observabilidad— miran el proyecto ENTERO y no tienen carpeta donde correr:
 * son paradas-de-TEMA y llegan en su propia fase. Colarlos aqui repetiria la
 * misma pregunta en cada parada, que es justo el gasto que el ADR evita.
 */
export const MODULOS_DE_CARPETA: readonly ModuloAuditoria[] = ['M3', 'M8', 'M9']

/**
 * Los de carpeta que ADEMAS aplican a este proyecto. Interseccion, y en el
 * orden de la constante para que dos prompts de la misma parada sean iguales:
 * el orden de `modulosAplicables` es el del vocabulario, no una prioridad.
 */
export const modulosDeParada = (
  aplicables: readonly ModuloAuditoria[]
): readonly ModuloAuditoria[] => MODULOS_DE_CARPETA.filter((m) => aplicables.includes(m))
