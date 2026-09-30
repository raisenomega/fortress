/**
 * El PERIMETRO del Motor: de quien es, y quien decide que trabaja (ADR-107).
 *
 * Familia propia de los innegociables porque su fuerza no puede depender de que
 * nadie proponga tocarla. El Motor trabaja sobre el repo PROPIO: un fix que
 * ensanchara esa puerta se estaria dando permiso a si mismo sobre codigo ajeno,
 * y la unica barrera seria que quien firma se diera cuenta. Es la misma razon
 * por la que `firma-limite` se aplica como resta final.
 */
export const DEFENSAS_DEL_PERIMETRO: readonly string[] = [
  // De quien es el Motor.
  'src/domain/repair/vehiculo-del-motor.ts',
  // Donde nace una propuesta: los dos sitios que preguntan la politica.
  'src/application/repair/plan-repair.ts',
  'src/application/repair/retry-repair.ts'
]
