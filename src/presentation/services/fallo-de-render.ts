import { observacionDeRender, type NotaDeRenderSinArea } from '@domain/system/observacion-de-render'

/** Lo que React entrega en `onUncaughtError` y en `onCaughtError`. */
export interface InfoDeRender {
  readonly componentStack?: string | undefined
}

/** Donde va el texto crudo. Inyectado para poder probar que el `message` y el
 *  arbol entero SALEN de la observacion y llegan aqui, y no al reves. */
export type Bitacora = (que: string, error: unknown, arbol: string) => void

const aConsola: Bitacora = (que, error, arbol) => console.error(que, error, arbol)

/**
 * ENGANCHE PENDIENTE (firma del operador). Hoy esta funcion CONSTRUYE la
 * observacion y la devuelve; nadie la asienta. Llevarla al backlog cruza el
 * puente, y el puente es innegociable.
 *
 * Lo que falta el dia de la firma, en este orden:
 *   (a) `reportarFalloDeRender` en `src/preload/index.ts`  [INNEGOCIABLE, firma]
 *   (b) un handler IPC que reciba la nota y llame a `add` con ESTA_INSTALACION
 *   (c) `'fallo-de-render'` entra en `AREAS_DE_FALLO`      [area y emisor juntos]
 *   (d) esta funcion llama a `api().sistema.reportarFalloDeRender(nota)`
 *
 * Y una consecuencia que conviene no maquillar: el texto crudo tampoco puede
 * llegar hoy a `userData/error-logs/fallos.log`. Escribir en disco es del
 * proceso principal, y el renderer corre aislado y sin Node por doctrina —jamas
 * importa `electron`, y la lista de innegociables protege esa garantia—. Asi que
 * va a la consola del renderer, que es el unico sitio al que alcanza sin cruzar.
 * La firma desbloquea las DOS cosas: el backlog y el log en disco.
 */
export function manejarFalloDeRender(
  error: unknown,
  info: InfoDeRender,
  bitacora: Bitacora = aConsola
): NotaDeRenderSinArea {
  const arbol = info.componentStack ?? ''
  const nota = observacionDeRender(arbol, (error as { name?: unknown } | null)?.name)
  bitacora('[ADR-086] fallo de render', error, arbol)
  return nota
}
