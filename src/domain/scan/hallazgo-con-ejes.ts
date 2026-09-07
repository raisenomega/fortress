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
