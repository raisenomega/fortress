import type { ModuloAuditoria } from './modulo-auditoria'

/**
 * Los modulos que NO se deciden por fichero y van al juicio con evidencia
 * (ADR-083). «Toca valor» y «toca datos personales» no son una dependencia ni
 * un nombre de carpeta: un `grep` de `price|balance` marca cualquier tienda que
 * solo MUESTRE precios, y `email|phone` marca hasta un formulario de contacto.
 *
 * Estar en esta lista tiene una consecuencia exacta: la ausencia de senal NO
 * los descarta. M8 tiene senal de dependencia —una pasarela de pago no admite
 * duda— pero no tenerla no prueba lo contrario, asi que sin ella baja al
 * juicio en vez de caer a descartado.
 */
export const MODULOS_A_JUICIO: readonly ModuloAuditoria[] = ['M3', 'M8']

export const APLICA_VALORES = ['si', 'no', 'no-consta'] as const

/** Vocabulario CERRADO del juicio, el que ADR-083 fijo palabra por palabra. */
export type Aplica = (typeof APLICA_VALORES)[number]

/** Lo que el clasificador responde de UN modulo. */
export interface VeredictoAplicabilidad {
  readonly modulo: ModuloAuditoria
  readonly aplica: Aplica
  /** La prueba: `fichero.ext:linea`. Sin ella el veredicto no vale. */
  readonly porque: string
}

/**
 * Una cita de codigo de verdad: ruta con extension y numero de linea. Estricta
 * a proposito —«el sistema cobra a los usuarios» no pasa, `src/pay/charge.ts:42`
 * si—, porque el modo de fallo es el permisivo: un patron ancho deja entrar
 * prosa disfrazada y el veredicto deja de ser comprobable.
 */
const CITA = /[\w./-]+\.\w+:\d+/

/**
 * Si el veredicto se puede USAR. Es la leccion de ADR-081 hecha codigo: «un
 * juicio con evidencia es auditable y la prosa no». Un `si` sin fichero:linea
 * no mueve nada —el modulo vuelve a «no consta»— por lo mismo que `checkFinding`
 * devuelve `info` cuando el hallazgo no cita archivo: la intencion no se juzga,
 * solo lo verificable.
 */
export const esUsable = (veredicto: VeredictoAplicabilidad): boolean =>
  veredicto.aplica !== 'no-consta' && CITA.test(veredicto.porque)
