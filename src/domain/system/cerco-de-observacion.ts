import { redactSecrets } from '../chat/tool-detail'
import { CARPETA, CITA, RUTA, RUTA_ABSOLUTA } from './reglas-del-cerco'

/** Lo que queda donde estaba la cita. Entre comillas angulares porque no es
 *  texto del agente: es una marca de que AQUI habia algo y se retiro. */
export const RUTA_REDACTADA = '‹ruta del proyecto›'

/**
 * El cerco de ADR-085: ninguna observacion de auto-mejora puede llevarse codigo
 * del cliente.
 *
 * REDACTA, nunca rechaza. Las ocho fugas que el inventario del 2026-09-11
 * encontro en el backlog eran observaciones LEGITIMAS sobre FORTRESS —«el grafo
 * no modela politicas RLS», «trace_path resuelve mal simbolos duplicados»— que
 * citaron el codigo que tenian delante para explicarse. El valor esta en la
 * observacion, no en la cita: tirar la nota entera perderia el aprendizaje y
 * ganaria lo mismo que tachar la ruta. Ante la duda se conserva (ADR-065).
 *
 * CUATRO reglas, y la de las rutas absolutas no sobra aunque exista
 * `ocultarRaiz`: aquella taja la raiz EXACTA y solo cuando se sabe cual es, asi
 * que no alcanza ni al barrido —una fila guardada no lleva su ruta— ni a una
 * ruta de OTRO proyecto que la nota mencione de paso. Medido al abrir la app el
 * 2026-09-11: 40 observaciones sobrevivieron al barrido con su ruta absoluta
 * entera. Ninguna era de un cliente, pero por casualidad y no por diseno.
 *
 * Redacta SIEMPRE, sin mirar de que proyecto viene. Distinguir el repo propio
 * seria util —perdemos el localizador en nuestras propias notas— pero la
 * excepcion se decidiria por el NOMBRE del proyecto, que lo pone el operador y
 * puede ser cualquiera; una garantia con una puerta falsificable no es una
 * garantia. El mismo motivo por el que los innegociables pasaron a cubrirse por
 * carpeta entera en vez de enumerando.
 *
 * Y llama a `redactSecrets`: una cita puede traer pegado un token. Vive en
 * `tool-detail`, que es INNEGOCIABLE — se llama, no se toca.
 *
 * LIMITE HONESTO, dicho aqui y en el ADR: esto no alcanza a la logica de negocio
 * descrita sin cita. «El precio se resuelve por coincidencia difusa del nombre
 * de producto» no lleva ni una ruta y sigue siendo del cliente. El cerco reduce
 * la fuga; no la elimina. Por eso la transmision automatica exige consentimiento.
 */
export function redactarObservacion(texto: string, projectPath?: string): string {
  const sinRutaAbsoluta = ocultarRaiz(texto, projectPath)
  const sinCitas = sinRutaAbsoluta
    .replace(RUTA_ABSOLUTA, RUTA_REDACTADA)
    .replace(CITA, RUTA_REDACTADA)
    .replace(RUTA, RUTA_REDACTADA)
    .replace(CARPETA, RUTA_REDACTADA)
  return redactSecrets(sinCitas)
}

/** La raiz del proyecto, si se sabe: una ruta absoluta delata al cliente incluso
 *  sin fichero detras —`/home/ana/clientes/acme` ya dice de quien es—. */
function ocultarRaiz(texto: string, projectPath?: string): string {
  if (projectPath === undefined || projectPath.trim().length === 0) return texto
  return texto.split(projectPath).join(RUTA_REDACTADA)
}
