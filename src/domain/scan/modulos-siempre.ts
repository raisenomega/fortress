import type { ModuloAuditoria } from './modulo-auditoria'

/**
 * Los modulos que aplican SIEMPRE, sin senal, sin declaracion y sin juicio.
 *
 * Precedente directo: las cinco pasadas P1-P5, que ADR-083 declaro nucleo
 * porque preguntar si aplican no tiene sentido. Estos tres son de esa familia
 * —propiedades de casi todo software, no rasgos de algunos—:
 *
 * - **M10 mantenibilidad**: todo codigo tiene deuda y complejidad. FORTRESS ya
 *   la mide (`maintainability-probe` cuenta ficheros largos), asi que preguntar
 *   si aplica es preguntar si el proyecto tiene codigo.
 * - **M6 rendimiento**: todo lo que corre tarda y consume. Que una libreria
 *   pequena de poco de si es CUANTO se encuentra, no SI aplica.
 * - **M1 audit trail**: casi todo sistema con usuarios registra acciones. Un
 *   CLI de una pasada recibira «M1 auditado, sin hallazgos», que es honesto:
 *   auditar y no encontrar nada NO es lo mismo que inventarle un defecto, y es
 *   preferible a callar el modulo entero.
 *
 * Cierra la deuda `clasificar-modulos-sin-senal`: con esto los doce tienen
 * hogar —tres siempre, tres de carpeta, cinco de tema, y M8/M3 a juicio— y
 * ninguno queda en «no consta» por no haberse clasificado nunca.
 */
export const MODULOS_SIEMPRE: readonly ModuloAuditoria[] = ['M1', 'M6', 'M10']
