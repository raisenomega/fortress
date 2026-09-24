import { esTipoDeAuditoria } from './defectos-de-auditoria'
import type { DetectedFinding } from './detected-finding'
import { leerEjes, type EjesCrudos } from './ejes-de-severidad'
import { bandaDe } from './severidad-derivada'

/**
 * Lo que el parser hace con los ejes de un hallazgo (ADR-080).
 *
 * Con los tres ejes validos, la severidad que MANDA es la derivada, y la que
 * dijo el modelo se conserva aparte como evidencia: la discrepancia entre las
 * dos se asienta despues, para medir cuanto se calibra el modelo con el tiempo.
 *
 * Sin ejes —o con uno fuera del vocabulario— se conserva la palabra del modelo
 * tal cual y el hallazgo se marca `sinEjes`. Es el mismo sesgo que
 * `aTipoDeDefecto` -> `otro`: fuera del vocabulario no se adivina, y NADA cae a
 * CRITICAL por una derivacion fallida. Las 208 filas anteriores a este ADR no
 * tienen ejes; un escaneo que las vuelva a nombrar las refresca por aqui.
 */
export function conSeveridadDerivada(crudos: EjesCrudos, base: DetectedFinding): DetectedFinding {
  const ejes = leerEjes(crudos)
  if (ejes === null) return { ...base, sinEjes: true }
  return { ...base, ...ejes, severity: bandaDe(ejes), severidadDelModelo: base.severity }
}

/**
 * ADR-103 §2 — la tabla de ADR-080 es de seguridad y no juzga lo que no es de
 * seguridad. Medido: el contrato obligaba a elegir ejes para todo, el modelo los
 * inventaba para un contraste (`anonimo·disponibilidad·explotable-hoy`) y la
 * tabla lo subia a HIGH; el mismo 4,08:1 salio HIGH y LOW segun los ejes de esa
 * vez. Para los seis tipos de auditoria manda la palabra del modelo y los ejes
 * que vengan de mas se ignoran: la excepcion es de FORTRESS, no del modelo. Se
 * marca `ejesNoAplican`, nunca `sinEjes`, que sigue midiendo la calibracion.
 */
export function conSeveridadSegunTipo(crudos: EjesCrudos, base: DetectedFinding): DetectedFinding {
  if (base.tipo !== undefined && esTipoDeAuditoria(base.tipo))
    return { ...base, ejesNoAplican: true }
  return conSeveridadDerivada(crudos, base)
}
