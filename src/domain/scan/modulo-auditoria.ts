/**
 * Los doce modulos de la campana de auditoria (ADR-083). Vocabulario CERRADO,
 * como `EstadoScan` y `MotivoCierre`: el manifiesto declara uno de estos doce y
 * ninguno mas.
 *
 * Las cinco pasadas P1-P5 NO estan aqui, y es a proposito: aplican SIEMPRE
 * —son el nucleo— y meterlas en el mismo vocabulario invitaria a preguntar si
 * P3 aplica, que es justo la pregunta que no existe.
 */
export const MODULOS_AUDITORIA = [
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
  'M9',
  'M10',
  'M11',
  'M12'
] as const

export type ModuloAuditoria = (typeof MODULOS_AUDITORIA)[number]

/** El nombre de su plantilla, para que una razon se lea sin abrir el kit. */
export const NOMBRE_MODULO: Record<ModuloAuditoria, string> = {
  M1: 'Audit trail',
  M2: 'DR/BCP',
  M3: 'Privacidad',
  M4: 'Terceros y supply-chain',
  M5: 'Gobernanza de IA',
  M6: 'Rendimiento y escala',
  M7: 'Gobernanza del SDLC',
  M8: 'Integridad de negocio',
  M9: 'Accesibilidad',
  M10: 'Mantenibilidad y deuda',
  M11: 'Continuidad operacional',
  M12: 'Observabilidad'
}

/**
 * Predicado y no coercion, al reves que `aEstadoScan` o `aMotivoCierre`: ahi
 * habia un centinela honesto —CERRADO, abortado— y aqui no lo hay. Caer a un
 * modulo cualquiera afirmaria que una plantilla se aplico, que es exactamente
 * la mentira que este arco viene a impedir. Lo que no se reconoce, se descarta.
 */
export function esModuloAuditoria(value: unknown): value is ModuloAuditoria {
  return (MODULOS_AUDITORIA as readonly unknown[]).includes(value)
}
