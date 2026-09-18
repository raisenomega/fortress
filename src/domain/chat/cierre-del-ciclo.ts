import type { DesenlaceDeVerificacion } from '../repair/dictamen-de-verificacion'
import type { VerificacionDelArbol } from './verificacion-del-arbol'

/**
 * En que queda el cierre del ciclo de un turno del Terminal (ADR-088, pieza 3).
 *
 *   extinguido, sin_prueba, sigue_vivo   los tres de la verificacion (ADR-087)
 *   pendiente   se marco mitigado y la verificacion NO llego a dictaminar: lanzo,
 *               Detener mato al analista, o no se lanzo. Queda escrito en la
 *               fila y en el turno — nunca un mitigado mudo que parezca cerrado
 *   no_vivo     el hallazgo dejo de estar activo durante el turno: no se marco
 */
export type CierreDelCiclo =
  | { readonly desenlace: DesenlaceDeVerificacion | 'no_vivo' }
  | { readonly desenlace: 'pendiente'; readonly motivo: string }

const relativa = (ruta: string, raiz: string): string =>
  raiz !== '' && ruta.startsWith(`${raiz}/`) ? ruta.slice(raiz.length + 1) : ruta

/**
 * La nota del mitigado. SIN sha: el Terminal no hace commit —el checkpoint se
 * retira y las ediciones quedan en el arbol para que el operador las integre—,
 * asi que cita el turno y los ficheros, relativos a la raiz y sin repetir.
 */
export function notaDelCierre(
  messageId: string,
  edits: readonly string[],
  raiz: string,
  arbol: VerificacionDelArbol = 'verde'
): string {
  const ficheros = [...new Set(edits.map((ruta) => relativa(ruta, raiz)))]
  // ADR-091: si nadie pudo compilarlo, la fila lo dice. Esta nota es lo que el
  // operador ve al volver al Escaneo, y es donde «se arreglo» tiene que dejar
  // de parecerse a «se arreglo y compila».
  const sinVerificar = arbol === 'desconocida' ? ' · SIN VERIFICAR: no habia con que compilar' : ''
  return `arreglado por el Terminal · turno ${messageId} · ficheros: ${ficheros.join(', ')}${sinVerificar}` // prettier-ignore
}

/** Lo que queda en la fila cuando no hubo dictamen: que NO se lea como verificado. */
export function pendienteDeVerificar(motivo: string): string {
  return (
    `pendiente de verificar: el cierre del Terminal no llego a un dictamen (${motivo}). ` +
    'NO esta verificado: reintentalo con Confirmar en esta fila'
  )
}

const PARTE: Record<Exclude<CierreDelCiclo['desenlace'], 'pendiente'>, string> = {
  extinguido:
    'el analista probo que el problema ya no esta. El hallazgo se cierra y pasa a Historia, ' +
    'a nombre del Terminal.',
  sin_prueba:
    'el analista no pudo probar que el problema se fue. El hallazgo NO se cierra: sigue ' +
    'mitigado en Escaneo, con la nota de este turno.',
  sigue_vivo:
    'el analista dice que el problema SIGUE en el codigo. El hallazgo vuelve a estar activo ' +
    'en Escaneo, con su dictamen.',
  no_vivo:
    'no se cerro nada. El hallazgo dejo de estar activo mientras el turno trabajaba ' +
    '(marcado, descartado o cerrado por otra via).'
}

/** Lo que el Terminal cuenta tras el turno: lo que de verdad paso con el hallazgo,
 *  que puede no ser lo que el agente creyo haber hecho. */
export function parteDelCierre(cierre: CierreDelCiclo): string {
  const cuerpo =
    cierre.desenlace === 'pendiente'
      ? `la verificacion no llego a un dictamen (${cierre.motivo}). El hallazgo queda mitigado ` +
        'y PENDIENTE de verificar en Escaneo: reintentalo con Confirmar en su fila.'
      : PARTE[cierre.desenlace]
  return `Cierre del ciclo (ADR-088): ${cuerpo}`
}
